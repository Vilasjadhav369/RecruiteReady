import express from 'express';
import protect from '../middleware/auth.js';
import {
  getGoals,
  createGoal,
  syncGoals,
  updateGoal,
  toggleGoal,
  deleteGoal,
} from '../controllers/goalController.js';

const router = express.Router();

// All goal endpoints require authenticated student/user session
router.use(protect);

router.get('/', getGoals);
router.post('/', createGoal);
router.post('/sync', syncGoals);
router.patch('/:id/toggle', toggleGoal);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
