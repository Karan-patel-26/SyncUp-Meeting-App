import { Request, Response } from 'express';
import { Message } from '../models/Message';

export const getMeetingMessages = async (req: Request, res: Response) => {
  try {
    const { meetingId } = req.params;

    const messages = await Message.find({ meetingId })
      .populate('senderId', 'username email') // Assuming User model has username and email
      .sort({ createdAt: 1 }) // Chronological order
      .lean();

    res.status(200).json(messages);
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages' });
  }
};
