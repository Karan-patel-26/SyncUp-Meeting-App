import { Request, Response } from 'express';
import { Meeting } from '../models/Meeting';
import { Recording } from '../models/Recording';
import { invalidateCache } from '../middlewares/cache.middleware';
import { generateMeetingSummary, analyzeMeetingMood } from '../services/ai.service';
import cloudinary from '../config/cloudinary';
import streamifier from 'streamifier';
import bcrypt from 'bcryptjs';

export const createMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, scheduledAt, password, waitingRoom } = req.body;
    const userId = req.userId;

    if (!title) {
      res.status(400).json({ message: 'Meeting title is required' });
      return;
    }

    let hashedPassword = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const meeting = new Meeting({
      title,
      description,
      scheduledAt,
      password: hashedPassword,
      waitingRoom: waitingRoom || false,
      host: userId,
      participants: [userId], // Add host to participants by default
    });

    await meeting.save();
    
    // Invalidate the "my meetings" cache for this user
    await invalidateCache(`*__/api/meetings__${userId}*`);

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

export const endMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const meeting = await Meeting.findById(id);

    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    if (meeting.host.toString() !== userId) {
      res.status(403).json({ message: 'Only the host can end the meeting' });
      return;
    }

    meeting.status = 'completed';
    meeting.endTime = new Date();
    await meeting.save();

    res.status(200).json({ message: 'Meeting ended successfully', meeting });
  } catch (error) {
    res.status(500).json({ message: 'Server error ending meeting' });
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

    // Invalidate caches
    await invalidateCache(`*__/api/meetings__${userId}*`);
    await invalidateCache(`*__/api/meetings/${id}__*`);

    res.status(200).json({ message: 'Meeting status updated', meeting });
  } catch (error) {
    res.status(500).json({ message: 'Server error updating meeting' });
  }
};

export const uploadRecording = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!req.file) {
      res.status(400).json({ message: 'No video file provided' });
      return;
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    // Wrap the Cloudinary upload stream in a Promise
    const uploadStream = () => {
      return new Promise<any>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { 
            folder: 'meeting_recordings',
            resource_type: 'video' 
          },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(req.file!.buffer).pipe(stream);
      });
    };

    const result = await uploadStream();

    const recording = new Recording({
      meetingId: id,
      title: `${meeting.title} - ${new Date().toLocaleString()}`,
      url: result.secure_url,
      duration: result.duration,
      size: result.bytes,
      recordedBy: userId
    });

    await recording.save();

    res.status(201).json({ message: 'Recording uploaded successfully', recording });
  } catch (error) {
    console.error('Error uploading recording:', error);
    res.status(500).json({ message: 'Server error during recording upload' });
  }
};

export const getRecordings = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    // Find meetings where user is a participant and get recordings for those
    const myMeetings = await Meeting.find({ participants: userId }).select('_id');
    const meetingIds = myMeetings.map(m => m._id);

    const recordings = await Recording.find({ meetingId: { $in: meetingIds } })
      .populate('meetingId', 'title')
      .sort({ createdAt: -1 });

    res.status(200).json({ recordings });
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching recordings' });
  }
};

export const summarizeMeeting = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { transcript } = req.body;

    if (!transcript) {
      res.status(400).json({ message: 'Transcript is required' });
      return;
    }

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    const { summary, actionItems } = await generateMeetingSummary(transcript);

    meeting.summary = summary;
    meeting.actionItems = actionItems;
    meeting.status = 'completed';
    await meeting.save();

    await invalidateCache(`*__/api/meetings/${id}__*`);

    res.status(200).json({ message: 'Meeting summarized successfully', summary, actionItems });
  } catch (error) {
    console.error('Error in summarizeMeeting:', error);
    res.status(500).json({ message: 'Server error during AI summarization' });
  }
};

export const verifyMeetingAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      res.status(404).json({ message: 'Meeting not found' });
      return;
    }

    if (meeting.password) {
      if (!password) {
        res.status(401).json({ message: 'Password required' });
        return;
      }
      const isMatch = await bcrypt.compare(password, meeting.password);
      if (!isMatch) {
        res.status(401).json({ message: 'Invalid password' });
        return;
      }
    }

    res.status(200).json({ message: 'Access granted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error verifying access' });
  }
};
export const analyzeMood = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content } = req.body;
    if (!content) {
      res.status(400).json({ message: 'Content is required' });
      return;
    }

    const analysis = await analyzeMeetingMood(content);
    res.status(200).json(analysis);
  } catch (error) {
    console.error('Error analyzing mood:', error);
    res.status(500).json({ message: 'Server error during mood analysis' });
  }
};
