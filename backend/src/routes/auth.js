import { Router } from 'express';
import {
  register,
  login,
  googleLogin,
  githubLogin,
  githubCallback,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  getCurrentUser,
  updateProfile,
  submitOnboarding,
  changePassword,
  logout,
  getActiveSessions,
  revokeSingleSession,
  logoutAllSessions,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Public authentication routes (with rate limiting)
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/google', authRateLimiter, googleLogin);
router.get('/github', authRateLimiter, githubLogin);
router.get('/github/callback', authRateLimiter, githubCallback);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password', authRateLimiter, resetPassword);
router.post('/verify-email', authRateLimiter, verifyEmail);
router.get('/verify-email', authRateLimiter, verifyEmail);
router.post('/resend-verification', authRateLimiter, resendVerification);
router.post('/logout', logout);

// Protected account routes
router.get('/me', protect, getCurrentUser);
router.get('/profile', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.put('/onboarding', protect, submitOnboarding);
router.patch('/onboarding', protect, submitOnboarding);
router.patch('/change-password', protect, authRateLimiter, changePassword);

// Session management routes (authenticated)
router.get('/sessions', protect, getActiveSessions);
router.delete('/sessions/:id', protect, revokeSingleSession);
router.post('/logout-all', protect, authRateLimiter, logoutAllSessions);

export default router;
