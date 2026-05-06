import express from 'express';
import { getMeetingMessages } from '../controllers/message.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { cacheResponse } from '../middlewares/cache.middleware';

const router = express.Router();

// Get all messages for a specific meeting, cache for 60 seconds
router.get('/:meetingId', requireAuth, cacheResponse(60), getMeetingMessages);

export default router;
