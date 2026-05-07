import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { sendOTPEmail, sendWelcomeEmail, sendLoginSuccessEmail } from '../services/mail.service';
import crypto from 'crypto';

const generateTokens = (userId: string) => {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET as string, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET as string, { expiresIn: '7d' });
  return { accessToken, refreshToken };
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ message: 'All fields are required' });
      return;
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const user = new User({ fullName, email, password, isVerified: true });
    await user.save();

    // Send welcome email asynchronously
    sendWelcomeEmail(email, fullName).catch(err => console.error('Failed to send welcome email:', err));

    const { accessToken, refreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      message: 'User created successfully',
      accessToken,
      user: { id: user.id, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log(`Login failed: User not found for email ${email}`);
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }



    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for email ${email}`);
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Send login success email
    sendLoginSuccessEmail(user.email, user.fullName).catch(err => console.error('Failed to send login email:', err));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user.id, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token not found' });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET as string) as { userId: string };
    
    // Check if user still exists
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id);

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({ accessToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.status(200).json({ user: { id: user.id, fullName: user.fullName, email: user.email, avatar: user.avatar } });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching profile' });
  }
};

export const requestOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found with this email' });
      return;
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    await sendOTPEmail(email, otp);

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Request OTP error:', error);
    res.status(500).json({ message: 'Server error requesting OTP' });
  }
};

export const loginWithOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      res.status(400).json({ message: 'Email and OTP are required' });
      return;
    }

    const user = await User.findOne({ email }).select('+otp +otpExpiry');
    if (!user || !user.otp || !user.otpExpiry) {
      res.status(401).json({ message: 'Invalid or missing OTP' });
      return;
    }

    // Check if OTP is correct and not expired
    if (user.otp !== otp || user.otpExpiry < new Date()) {
      res.status(401).json({ message: 'Invalid or expired OTP' });
      return;
    }

    // Mark user as verified and clear OTP after successful login
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const { accessToken, refreshToken } = generateTokens(user.id);
    
    // Send login success email
    sendLoginSuccessEmail(user.email, user.fullName).catch(err => console.error('Failed to send login email:', err));

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.status(200).json({
      message: 'Login successful',
      accessToken,
      user: { id: user.id, fullName: user.fullName, email: user.email }
    });
  } catch (error) {
    console.error('OTP login error:', error);
    res.status(500).json({ message: 'Server error during OTP login' });
  }
};
export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, avatar, preferences } = req.body;
    const user = await User.findById(req.userId);
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (fullName) user.fullName = fullName;
    if (avatar) user.avatar = avatar;
    if (preferences) user.preferences = preferences;

    await user.save();

    res.status(200).json({ 
      message: 'Settings updated successfully', 
      user: { 
        id: user.id, 
        fullName: user.fullName, 
        email: user.email, 
        avatar: user.avatar,
        preferences: user.preferences
      } 
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ message: 'Server error updating settings' });
  }
};
