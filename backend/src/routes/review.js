import express from 'express';
import {
  createReview,
  getApprovedReviews,
  getMyReview,
  updateMyReview,
  deleteMyReview,
} from '../controllers/reviewController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Publicly view approved reviews
router.get('/', getApprovedReviews);

// Authenticated student operations
router.get('/my', protect, getMyReview);
router.post('/', protect, createReview);
router.put('/:id', protect, updateMyReview);
router.delete('/:id', protect, deleteMyReview);

export default router;
