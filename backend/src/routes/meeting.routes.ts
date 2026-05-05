import { Router } from 'express';
import { createMeeting, getMyMeetings, getMeetingById, updateMeetingStatus } from '../controllers/meeting.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { cacheResponse } from '../middlewares/cache.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createMeeting);
router.get('/', cacheResponse(60), getMyMeetings);
router.get('/:id', cacheResponse(60), getMeetingById);
router.patch('/:id/status', updateMeetingStatus);

export default router;
