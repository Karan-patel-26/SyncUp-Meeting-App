import mongoose, { Document, Schema } from 'mongoose';

export interface IMeeting extends Document {
  title: string;
  description?: string;
  host: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  status: 'scheduled' | 'active' | 'completed';
  startTime?: Date;
  endTime?: Date;
}

const meetingSchema = new Schema<IMeeting>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    host: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    status: {
      type: String,
      enum: ['scheduled', 'active', 'completed'],
      default: 'scheduled',
    },
    summary: {
      type: String,
    },
    actionItems: {
      type: [String],
      default: [],
    },
    password: {
      type: String,
    },
    waitingRoom: {
      type: Boolean,
      default: false,
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Meeting = mongoose.model<IMeeting>('Meeting', meetingSchema);
