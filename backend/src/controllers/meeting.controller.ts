import { Request, Response } from 'express';
import { Meeting } from '../models/Meeting';

export const createMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description } = req.body;
    const userId = req.userId;

    if (!title) {
      res.status(400).json({ message: 'Meeting title is required' });
      return;
    }

    const meeting = new Meeting({
      title,
      description,
      host: userId,
      participants: [userId], // Add host to participants by default
    });

    await meeting.save();

    res.status(201).json({ message: 'Meeting created successfully', meeting });
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: 'Server error creating meeting' });
  }
};

export const getMyMeetings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const meetings = await Meeting.find({ participants: userId })
      .populate('host', 'fullName email avatar')
      .sort({ createdAt: -1 });

    res.status(200).json({ meetings });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching meetings' });
  }
};

export const getMeetingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const meeting = await Meeting.findById(id).populate('host', 'fullName email avatar').populate('participants', 'fullName email avatar');

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    res.status(200).json({ meeting });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching meeting details' });
  }
};

export const updateMeetingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.userId;

    if (!['scheduled', 'active', 'completed'].includes(status)) {
      res.status(400).json({ message: 'Invalid status' });
      return;
    }

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Only host can update status
    if (meeting.host.toString() !== userId) {
      res.status(403).json({ message: 'Only the host can update the meeting status' });
      return;
    }

    meeting.status = status;
    if (status === 'active' && !meeting.startTime) meeting.startTime = new Date();
    if (status === 'completed' && !meeting.endTime) meeting.endTime = new Date();

    await meeting.save();

    res.status(200).json({ message: 'Meeting status updated', meeting });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating meeting' });
  }
};
