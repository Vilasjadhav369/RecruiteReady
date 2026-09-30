import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController.js';
import protect from '../middleware/auth.js';

const router = Router();

// All dashboard endpoints require authentication
router.get('/summary', protect, getDashboardSummary);

export default router;
