import { Router } from 'express';
import { createMeeting, getMyMeetings, getMeetingById, updateMeetingStatus, uploadRecording, getRecordings, summarizeMeeting, verifyMeetingAccess } from '../controllers/meeting.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { cacheResponse } from '../middlewares/cache.middleware';
import { videoUpload } from '../middlewares/upload.middleware';

const router = Router();

router.use(requireAuth);

router.post('/', createMeeting);
router.get('/', cacheResponse(60), getMyMeetings);
router.get('/recordings', getRecordings);
router.get('/:id', cacheResponse(60), getMeetingById);
router.patch('/:id/status', updateMeetingStatus);
router.post('/:id/recordings', videoUpload.single('recording'), uploadRecording);
router.post('/:id/summarize', summarizeMeeting);
router.post('/:id/verify-access', verifyMeetingAccess);

export default router;
