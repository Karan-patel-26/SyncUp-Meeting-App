import { Router } from 'express';
import { createMeeting, getMyMeetings, getMeetingById, updateMeetingStatus } from '../controllers/meeting.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createMeeting);
router.get('/', getMyMeetings);
router.get('/:id', getMeetingById);
router.patch('/:id/status', updateMeetingStatus);

export default router;
