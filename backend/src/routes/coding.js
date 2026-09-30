import express from 'express';
import {
  getProblems,
  getProblemById,
  submitProblem,
  getSubmissions,
  getSubmissionById,
} from '../controllers/codingController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Student coding endpoints are protected
router.use(protect);

router.get('/problems', getProblems);
router.get('/problems/:id', getProblemById);
router.post('/problems/:id/submit', submitProblem);
router.get('/submissions', getSubmissions);
router.get('/submissions/:id', getSubmissionById);

export default router;
