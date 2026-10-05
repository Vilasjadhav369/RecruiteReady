import mongoose from 'mongoose';
import Review from '../models/Review.js';
import notificationService from '../services/notificationService.js';

/**
 * POST /api/reviews
 * Submit a student review for moderation.
 * Enforces authenticated student association, validation, and single active review per student.
 */
export const createReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;

    const numRating = Number(rating);
    if (!numRating || numRating < 1 || numRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
    }
    if (!comment || !comment.trim()) {
      return res.status(400).json({ success: false, message: 'Review comment cannot be empty' });
    }
    if (comment.trim().length > 2000) {
      return res.status(400).json({ success: false, message: 'Review comment cannot exceed 2000 characters' });
    }

    // Check if the student already has an existing review
    const existingReview = await Review.findOne({ user: req.user._id });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review. You can edit your existing feedback.',
        data: { review: existingReview },
      });
    }

    const review = await Review.create({
      user: req.user._id,
      student: req.user._id,
      rating: numRating,
      title: (title || '').trim(),
      comment: comment.trim(),
      status: 'pending',
    });

    // Notify administrators about pending review submission
    await notificationService.createAdminNotification({
      type: 'admin_review_pending',
      title: 'New Review Pending Moderation',
      message: `${req.user.firstName || 'A student'} submitted a ${review.rating}-star review awaiting approval.`,
      link: '/admin/reviews',
      metadata: { entityId: review._id.toString() },
    });

    res.status(201).json({
      success: true,
      message: 'Your review has been submitted and is awaiting approval by moderators.',
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
 * GET /api/reviews/my
 * Retrieve the authenticated student's own review and moderation status.
 */
export const getMyReview = async (req, res, next) => {
  try {
    const review = await Review.findOne({ user: req.user._id }).lean();
    res.status(200).json({
      success: true,
      data: { review: review || null },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/reviews/:id
 * Update authenticated student's own review.
 * Any modification resets status back to pending moderation.
 */
export const updateMyReview = async (req, res, next) => {
  try {
    const { rating, title, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID' });
    }

    const review = await Review.findOne({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found or not authorized' });
    }

    if (rating !== undefined) {
      const numRating = Number(rating);
      if (!numRating || numRating < 1 || numRating > 5) {
        return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars' });
      }
      review.rating = numRating;
    }

    if (title !== undefined) {
      review.title = (title || '').trim();
    }

    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({ success: false, message: 'Review comment cannot be empty' });
      }
      if (comment.trim().length > 2000) {
        return res.status(400).json({ success: false, message: 'Review comment cannot exceed 2000 characters' });
      }
      review.comment = comment.trim();
    }

    // Editing requires re-moderation per security & quality guidelines
    review.status = 'pending';
    review.moderatedAt = null;
    review.moderatedBy = null;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Your review has been updated and is awaiting re-approval by moderators.',
      data: {
        review: {
          _id: review._id,
          rating: review.rating,
          title: review.title,
          comment: review.comment,
          status: review.status,
          updatedAt: review.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/reviews/:id
 * Delete authenticated student's own review.
 */
export const deleteMyReview = async (req, res, next) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: 'Invalid review ID' });
    }

    const review = await Review.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found or not authorized' });
    }

    res.status(200).json({
      success: true,
      message: 'Your review has been deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/reviews
 * Publicly list approved student reviews with real pagination and aggregated rating.
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

    // Calculate real rating summary only from genuine approved reviews in database
    const stats = await Review.aggregate([
      { $match: { status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          totalCount: { $sum: 1 },
        },
      },
    ]);

    const summary =
      stats.length > 0 && stats[0].totalCount > 0
        ? {
            averageRating: Number(stats[0].avgRating.toFixed(1)),
            totalReviews: stats[0].totalCount,
          }
        : null;

    // Mask name deterministically: "John D."
    const sanitizedReviews = reviews.map((r) => ({
      _id: r._id,
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      author: r.user
        ? `${r.user.firstName || ''} ${r.user.lastName ? r.user.lastName.charAt(0) + '.' : ''}`.trim() || 'Student'
        : 'Student',
      college: r.user?.college || '',
      createdAt: r.createdAt,
    }));

    res.status(200).json({
      success: true,
      data: {
        reviews: sanitizedReviews,
        summary,
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
