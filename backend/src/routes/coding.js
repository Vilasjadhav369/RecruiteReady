import express from 'express';
import {
  getProblems,
  getProblemById,
  runProblemCode,
  submitProblem,
  getSubmissions,
  getSubmissionById,
} from '../controllers/codingController.js';
import protect from '../middleware/auth.js';
import { isCodingEnabled } from '../config/features.js';

const router = express.Router();

// Guard all /api/coding/* endpoints when coding module is disabled
router.use((req, res, next) => {
  if (!isCodingEnabled()) {
    return res.status(404).json({
      success: false,
      message: 'Not available',
    });
  }
  next();
});

// Student coding endpoints are protected
router.use(protect);

router.get('/problems', getProblems);
router.get('/problems/:id', getProblemById);
router.post('/problems/:id/run', runProblemCode);
router.post('/problems/:id/submit', submitProblem);
router.get('/submissions', getSubmissions);
router.get('/submissions/:id', getSubmissionById);

export default router;
