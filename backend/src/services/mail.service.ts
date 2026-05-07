import nodemailer from 'nodemailer';
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
  ],
});

// Create transporter
let transporter: any;

const initTransporter = async () => {
  if (process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false, // true for 465, false for other ports
      connectionTimeout: 10000,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    try {
      await transporter.verify();
      logger.info(`[MAIL] SMTP connected successfully to ${process.env.SMTP_HOST}`);
    } catch (err) {
      logger.error(`[MAIL] SMTP connection failed:`, err);
    }
  } else {
    // Fallback: Create a test account on ethereal.email
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    logger.info(`[MAIL] Using Ethereal Email. View logs to see test mailbox links.`);
  }
};

initTransporter();

export const sendOTPEmail = async (email: string, otp: string) => {
  const mailOptions = {
    from: '"SyncUp AI" <noreply@syncup.ai>',
    to: email,
    subject: 'Your Login OTP - SyncUp',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">SyncUp Login</h2>
        <p>Hello,</p>
        <p>Your one-time password (OTP) for logging into SyncUp is:</p>
        <div style="background: #f3f4f6; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; border-radius: 8px; margin: 20px 0;">
          ${otp}
        </div>
        <p>This code will expire in 10 minutes. If you did not request this code, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2026 SyncUp AI Video Conferencing</p>
      </div>
    `,
  };

  try {
    if (!transporter) await initTransporter();
    const info = await transporter.sendMail(mailOptions);
    
    if (info.host === 'smtp.ethereal.email') {
      console.log('\n' + '='.repeat(60));
      console.log(`[TEST EMAIL SENT] FOR: ${email}`);
      console.log(`OTP CODE: ${otp}`);
      console.log(`VIEW FULL EMAIL HERE: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('='.repeat(60) + '\n');
    } else {
      logger.info(`OTP email sent to ${email}`);
    }
  } catch (error) {
    logger.error('Error sending OTP email:', error);
    // Fallback to console if everything fails
    console.log(`[FALLBACK OTP] FOR: ${email} CODE: ${otp}`);
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: '"SyncUp AI" <noreply@syncup.ai>',
    to: email,
    subject: 'Welcome to SyncUp!',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">Welcome to SyncUp!</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your account has been successfully registered. You are now ready to experience the next generation of AI-powered video conferencing.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" style="background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
        </div>
        <p>If you have any questions, feel free to reply to this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2026 SyncUp AI Video Conferencing</p>
      </div>
    `,
  };

  try {
    if (!transporter) await initTransporter();
    const info = await transporter.sendMail(mailOptions);
    if (info.host === 'smtp.ethereal.email') {
      console.log(`[WELCOME EMAIL SENT] VIEW HERE: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error('Error sending welcome email:', error);
  }
};

export const sendLoginSuccessEmail = async (email: string, name: string) => {
  const mailOptions = {
    from: '"SyncUp AI" <security@syncup.ai>',
    to: email,
    subject: 'Successful Login - SyncUp',
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #6366f1; text-align: center;">New Login Detected</h2>
        <p>Hello <strong>${name}</strong>,</p>
        <p>This is to confirm that you have successfully logged into your SyncUp account.</p>
        <div style="background: #f9fafb; padding: 15px; border-radius: 8px; font-size: 14px; color: #4b5563;">
          <strong>Time:</strong> ${new Date().toLocaleString()}<br />
          <strong>Status:</strong> Success
        </div>
        <p>If this wasn't you, please change your password immediately or contact our support team.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="font-size: 12px; color: #6b7280; text-align: center;">&copy; 2026 SyncUp AI Video Conferencing</p>
      </div>
    `,
  };

  try {
    if (!transporter) await initTransporter();
    const info = await transporter.sendMail(mailOptions);
    if (info.host === 'smtp.ethereal.email') {
      console.log(`[LOGIN SUCCESS EMAIL SENT] VIEW HERE: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (error) {
    logger.error('Error sending login success email:', error);
  }
};
