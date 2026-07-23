import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  getMe,
  updateProfile,
  changePassword,
  setup,
  getSetupStatus,
  requestOTP,
  verifyOTP,
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../controllers/authController.js';
import { validate } from '../middleware/validate.js';
import { authenticateToken } from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.get('/setup-status', getSetupStatus);
router.post('/setup', validate(registerSchema), setup);
router.post('/register', validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/otp/request', authRateLimiter, requestOTP);
router.post('/otp/verify', authRateLimiter, verifyOTP);
router.post('/logout', logout);
router.post('/refresh-token', refreshToken);

router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);
router.put('/change-password', authenticateToken, validate(changePasswordSchema), changePassword);

export default router;
