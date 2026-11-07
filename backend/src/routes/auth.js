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
import {
  authRateLimiter,
  loginRateLimiter,
  registerRateLimiter,
  passwordRecoveryRateLimiter,
} from '../middleware/rateLimiter.js';

const router = Router();

// Public authentication routes (with rate limiting)
router.post('/register', registerRateLimiter, register);
router.post('/login', loginRateLimiter, login);
router.post('/google', loginRateLimiter, googleLogin);
router.get('/github', loginRateLimiter, githubLogin);
router.get('/github/callback', loginRateLimiter, githubCallback);
router.post('/forgot-password', passwordRecoveryRateLimiter, forgotPassword);
router.post('/reset-password', passwordRecoveryRateLimiter, resetPassword);
router.post('/verify-email', passwordRecoveryRateLimiter, verifyEmail);
router.get('/verify-email', passwordRecoveryRateLimiter, verifyEmail);
router.post('/resend-verification', passwordRecoveryRateLimiter, resendVerification);
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
