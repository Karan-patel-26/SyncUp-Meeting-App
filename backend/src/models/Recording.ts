import mongoose, { Document, Schema } from 'mongoose';

export interface IRecording extends Document {
  meetingId: mongoose.Types.ObjectId;
  title: string;
  url: string;
  duration?: number;
  size?: number;
  recordedBy: mongoose.Types.ObjectId;
}

const recordingSchema = new Schema<IRecording>(
  {
    meetingId: {
      type: Schema.Types.ObjectId,
      ref: 'Meeting',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
    },
    size: {
      type: Number,
    },
    recordedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Recording = mongoose.model<IRecording>('Recording', recordingSchema);
