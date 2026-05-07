import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { signup, login, refresh, logout, getProfile, requestOTP, loginWithOTP, updateSettings } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

// Rate limit for authentication attempts (disabled in dev)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Effectively disabled
  message: { message: 'Too many login/signup attempts' },
});

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.post('/request-otp', authLimiter, requestOTP);
router.post('/login-otp', authLimiter, loginWithOTP);
router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', requireAuth, getProfile);
router.patch('/settings', requireAuth, updateSettings);

export default router;
