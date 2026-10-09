import express from 'express';
import { getCurrentUser, updateProfile, submitOnboarding, changePassword } from '../controllers/authController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All student profile routes require valid authentication
router.use(protect);

router.get('/', getCurrentUser);
router.put('/', updateProfile);
router.put('/onboarding', submitOnboarding);
router.patch('/onboarding', submitOnboarding);
router.patch('/change-password', changePassword);

export default router;
