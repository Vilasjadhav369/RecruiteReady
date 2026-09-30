import express from 'express';
import {
  startSession,
  getSession,
  saveAnswer,
  submitSession,
  getSessionResult,
  getAptitudeHistory,
  getAptitudeMetadata,
} from '../controllers/aptitudeController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All aptitude session routes are protected for students
router.use(protect);

router.get('/metadata', getAptitudeMetadata);
router.post('/sessions', startSession);
router.get('/sessions/:id', getSession);
router.patch('/sessions/:id/answers', saveAnswer);
router.post('/sessions/:id/submit', submitSession);
router.get('/results/:id', getSessionResult);
router.get('/history', getAptitudeHistory);

export default router;
