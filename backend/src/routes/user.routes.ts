import { Router } from 'express';
import { uploadAvatar } from '../controllers/user.controller';
import { requireAuth } from '../middlewares/auth.middleware';
import { upload } from '../middlewares/upload.middleware';

const router = Router();

// Route to upload/update an avatar, requires authentication and single file named 'avatar'
router.post('/avatar', requireAuth, upload.single('avatar'), uploadAvatar);

export default router;
