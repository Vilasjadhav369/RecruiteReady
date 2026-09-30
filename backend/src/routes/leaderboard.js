import express from 'express';
import { getLeaderboard } from '../controllers/leaderboardController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Allow authenticated students to view the campus leaderboard
router.use(protect);
router.get('/', getLeaderboard);

export default router;
