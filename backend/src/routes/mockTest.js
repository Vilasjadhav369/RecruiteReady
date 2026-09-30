import express from 'express';
import {
  getMockTests,
  getMockTestById,
  startMockTestAttempt,
  getAttempt,
  saveAttemptAnswer,
  submitMockTestAttempt,
  getAttemptResult,
  getMockTestHistory,
} from '../controllers/mockTestController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.get('/', getMockTests);
router.get('/history', getMockTestHistory);
router.get('/attempts/:id', getAttempt);
router.patch('/attempts/:id/answers', saveAttemptAnswer);
router.post('/attempts/:id/submit', submitMockTestAttempt);
router.get('/attempts/:id/result', getAttemptResult);
router.get('/:id', getMockTestById);
router.post('/:id/start', startMockTestAttempt);

export default router;
