import mongoose from 'mongoose';
import Review from '../models/Review.js';

/**
 * POST /api/reviews
 * Submit a student review for moderation.
 */
export const createReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Review comment cannot be empty' });
    }

    const review = await Review.create({
      user: req.user._id,
      student: req.user._id,
      rating: numRating,
      title: (title || '').trim(),
      comment: comment.trim(),
      status: 'pending',
    });

    res.status(201).json({
      success: true,
      message: 'Your review has been submitted for moderation. Thank you for your feedback!',
      data: {
        review: {
          _id: review._id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          status: review.status,
          createdAt: review.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews
 * Publicly list approved student reviews.
 */
export const getApprovedReviews = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const total = await Review.countDocuments({ status: 'approved' });
    const reviews = await Review.find({ status: 'approved' })
      .populate('user', 'firstName lastName college')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Mask name for privacy: "John D."
    const sanitizedReviews = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      author: r.user
        ? `${r.user.firstName} ${r.user.lastName ? r.user.lastName.charAt(0) + '.' : ''}`
        : 'Student',
      college: r.user?.college || 'Engineering College',
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        reviews: sanitizedReviews,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};
