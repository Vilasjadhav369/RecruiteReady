import { Router } from 'express';
import {
  register,
  login,
  getCurrentUser,
  updateProfile,
  changePassword,
  logout,
} from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.get('/profile', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);
router.patch('/change-password', protect, changePassword);

export default router;
