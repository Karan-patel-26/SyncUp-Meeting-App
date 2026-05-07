import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  fullName: string;
  email: string;
  password?: string;
  avatar?: string;
  otp?: string;
  otpExpiry?: Date;
  isVerified: boolean;
  preferences: {
    notifications: {
      email: boolean;
      chatSounds: boolean;
      handRaise: boolean;
    };
    privacy: {
      defaultWaitingRoom: boolean;
      defaultPassword: boolean;
      profileVisibility: string;
    };
  };
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: false, // Make optional for OTP-only users
      select: false,
    },
    otp: {
      type: String,
      select: false,
    },
    otpExpiry: {
      type: Date,
      select: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    isVerified: {
      type: Boolean,
      default: true,
    },
    preferences: {
      notifications: {
        email: { type: Boolean, default: true },
        chatSounds: { type: Boolean, default: true },
        handRaise: { type: Boolean, default: true },
      },
      privacy: {
        defaultWaitingRoom: { type: Boolean, default: true },
        defaultPassword: { type: Boolean, default: false },
        profileVisibility: { type: String, default: 'Everyone' },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password as string, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', userSchema);
