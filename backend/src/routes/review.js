import express from 'express';
import { createReview, getApprovedReviews } from '../controllers/reviewController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// Publicly view approved reviews
router.get('/', getApprovedReviews);

// Submitting a review requires student authentication
router.post('/', protect, createReview);

export default router;
