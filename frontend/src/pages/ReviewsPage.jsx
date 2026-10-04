import React, { useState, useEffect, useRef } from 'react';
import {
  getReviews,
  getMyReview,
  submitReview,
  updateReview,
  deleteReview,
} from '../services/reviewService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Modal,
  SkeletonCard,
  ErrorState,
  EmptyState,
} from '../components/ui/index.js';
import {
  StarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EditIcon,
  TrashIcon,
} from '../components/ui/Icons.jsx';
import ReviewCard from '../components/ReviewCard.jsx';

/**
 * Accessible Star Rating Selector
 * Initial state represents unselected (null).
 * Accessible via mouse, touch, keyboard, and screen readers.
 */
function RatingSelector({ value = null, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(0);
  const currentRating = hovered || value || 0;

  const RATING_LABELS = {
    1: '1 Star — Poor',
    2: '2 Stars — Fair',
    3: '3 Stars — Good',
    4: '4 Stars — Very Good',
    5: '5 Stars — Excellent',
  };

  return (
    <div className="space-y-1.5">
      <div
        className="flex items-center gap-1.5"
        role="radiogroup"
        aria-label="Star rating selection"
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const isFilled = currentRating >= star;
          const isSelected = value === star;

          return (
            <button
              type="button"
              key={star}
              disabled={disabled}
              onClick={() => onChange(star)}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onFocus={() => setHovered(star)}
              onBlur={() => setHovered(0)}
              aria-label={`${star} of 5 stars`}
              aria-checked={isSelected}
              role="radio"
              className="p-1 rounded-md text-amber-400 hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-[#166534]/30 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <StarIcon
                className="w-6 h-6 text-amber-400"
                filled={isFilled}
              />
            </button>
          );
        })}
        <span className="text-xs font-semibold text-slate-700 ml-2 font-mono">
          {currentRating > 0 ? `${currentRating} / 5` : 'No rating selected'}
        </span>
      </div>
      {currentRating > 0 && (
        <p className="text-[11px] text-slate-500 font-medium">
          {RATING_LABELS[currentRating]}
        </p>
      )}
    </div>
  );
}

export default function ReviewsPage() {
  // Community Reviews & Summary
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Authenticated Student's Review
  const [myReview, setMyReview] = useState(null);
  const [myReviewLoading, setMyReviewLoading] = useState(true);

  // Review Form State
  const [isEditing, setIsEditing] = useState(false);
  const [rating, setRating] = useState(null);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [formError, setFormError] = useState(null);

  // Delete Confirmation Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formRef = useRef(null);

  // Fetch approved community reviews
  const fetchApprovedReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReviews({ page, limit: 10 });
      setReviews(data?.reviews || []);
      setSummary(data?.summary || null);
      setPagination(data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      console.error('Failed to load student reviews:', err);
      setError('Unable to load student reviews. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student's own review
  const fetchMyReview = async () => {
    try {
      setMyReviewLoading(true);
      const review = await getMyReview();
      setMyReview(review || null);
    } catch (err) {
      console.error('Failed to load user review:', err);
    } finally {
      setMyReviewLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedReviews();
  }, [page]);

  useEffect(() => {
    fetchMyReview();
  }, []);

  const handleStartEdit = () => {
    if (!myReview) return;
    setIsEditing(true);
    setRating(myReview.rating);
    setTitle(myReview.title || '');
    setComment(myReview.comment || '');
    setFormError(null);
    setSubmitMessage(null);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setRating(null);
    setTitle('');
    setComment('');
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitMessage(null);

    if (!rating) {
      setFormError('Please select a star rating from 1 to 5 before submitting.');
      return;
    }

    if (!comment.trim()) {
      setFormError('Please write a short review before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      if (isEditing && myReview) {
        const res = await updateReview(myReview._id, {
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });
        setSubmitMessage(
          res.message || 'Your review has been updated and is awaiting approval.'
        );
        setIsEditing(false);
      } else {
        const res = await submitReview({
          rating,
          title: title.trim(),
          comment: comment.trim(),
        });
        setSubmitMessage(
          res.message || 'Your review has been submitted and is awaiting approval.'
        );
      }

      // Reset form fields
      setRating(null);
      setTitle('');
      setComment('');

      // Refresh student's review and community list
      await fetchMyReview();
      await fetchApprovedReviews();
    } catch (err) {
      console.error('Submit review error:', err);
      setFormError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!myReview) return;
    try {
      setDeleting(true);
      await deleteReview(myReview._id);
      setIsDeleteModalOpen(false);
      setMyReview(null);
      setIsEditing(false);
      setSubmitMessage('Your review has been removed.');
      await fetchApprovedReviews();
    } catch (err) {
      console.error('Delete review error:', err);
      setFormError(err.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeleting(false);
    }
  };

  const handleScrollToForm = () => {
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const commentInput = formRef.current.querySelector('textarea');
      if (commentInput) {
        commentInput.focus();
      }
    }
  };

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Reviews' },
  ];

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Student Reviews"
        description="Share your preparation journey and read genuine feedback from fellow students."
        breadcrumbs={breadcrumbs}
        badge={
          pagination.total > 0 ? (
            <Badge variant="brand">
              {pagination.total} {pagination.total === 1 ? 'Approved Review' : 'Approved Reviews'}
            </Badge>
          ) : null
        }
        actions={
          !myReview && (
            <Button variant="primary" size="sm" onClick={handleScrollToForm}>
              Share Your Experience
            </Button>
          )
        }
      />

      {/* Aggregate Rating Summary Card (Rendered only if real approved reviews exist) */}
      {summary && summary.totalReviews > 0 && (
        <Card className="border-slate-200/80 shadow-xs bg-white">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="text-3xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {summary.averageRating}
                <span className="text-sm sm:text-base font-normal text-slate-400"> / 5</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-amber-400">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon
                      key={s}
                      filled={s <= Math.round(summary.averageRating)}
                      className="w-4 h-4 text-amber-400"
                    />
                  ))}
                </div>
                <p className="text-xs text-slate-500 font-medium">
                  Based on {summary.totalReviews} verified student {summary.totalReviews === 1 ? 'review' : 'reviews'}
                </p>
              </div>
            </div>

            <div className="text-xs text-slate-500 border-l border-slate-200 pl-4 sm:pl-6 max-w-sm">
              All published ratings reflect actual student submissions verified through moderator approval.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Student's Existing Review Status Card (If already submitted) */}
      {myReview && !isEditing && (
        <Card className="border-slate-200/80 shadow-xs bg-[#F0FDF4]/40 border-l-4 border-l-[#166534]">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div className="space-y-0.5">
              <CardTitle className="text-base text-slate-900">Your Submitted Feedback</CardTitle>
              <p className="text-xs text-slate-500">
                You have an active review record linked to your account.
              </p>
            </div>
            {myReview.status === 'approved' ? (
              <Badge variant="success" dot>Approved & Published</Badge>
            ) : myReview.status === 'rejected' ? (
              <Badge variant="danger" dot>Needs Revision</Badge>
            ) : (
              <Badge variant="warning" dot>Pending Moderation</Badge>
            )}
          </CardHeader>
          <CardContent className="p-5 sm:p-6 space-y-4">
            {myReview.status === 'pending' && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                Your review has been submitted and is awaiting approval by platform administrators before appearing in public listings.
              </div>
            )}
            {myReview.status === 'rejected' && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                Your review was not approved by moderators. You may edit your submission to provide clearer or more constructive placement feedback.
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-amber-400">
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon
                    key={s}
                    filled={s <= myReview.rating}
                    className="w-4 h-4 text-amber-400"
                  />
                ))}
                <span className="text-xs font-semibold text-slate-700 ml-2 font-mono">
                  {myReview.rating} / 5
                </span>
              </div>
              {myReview.title && (
                <h4 className="text-sm font-bold text-slate-900">{myReview.title}</h4>
              )}
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {myReview.comment}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                size="sm"
                iconLeft={<EditIcon className="w-3.5 h-3.5" />}
                onClick={handleStartEdit}
              >
                Edit Feedback
              </Button>
              <Button
                variant="ghost"
                size="sm"
                iconLeft={<TrashIcon className="w-3.5 h-3.5 text-rose-600" />}
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              >
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Two-Column Layout: Form (Left) & Community Reviews (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Review Submission / Editing Form */}
        <div ref={formRef} className="lg:col-span-1">
          <Card className="border-slate-200/80 shadow-xs sticky lg:top-24">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base">
                {isEditing ? 'Edit Your Experience' : 'Share Your Experience'}
              </CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEditing
                  ? 'Modifying your review will resubmit it for moderator approval.'
                  : 'All reviews undergo moderation before appearing publicly.'}
              </p>
            </CardHeader>
            <CardContent className="p-5 sm:p-6 space-y-4">
              {submitMessage && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2.5">
                  <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{submitMessage}</span>
                </div>
              )}

              {formError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2.5">
                  <AlertCircleIcon className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{formError}</span>
                </div>
              )}

              {myReview && !isEditing ? (
                <div className="text-center py-6 space-y-3">
                  <p className="text-xs text-slate-500">
                    You have already submitted a review. Each student may maintain one active review on the platform.
                  </p>
                  <Button variant="outline" size="sm" onClick={handleStartEdit}>
                    Edit Your Review
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Rating Input */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Overall Rating <span className="text-rose-500">*</span>
                    </label>
                    <RatingSelector
                      value={rating}
                      onChange={(r) => setRating(r)}
                      disabled={submitting}
                    />
                  </div>

                  {/* Title Input */}
                  <div className="space-y-1.5">
                    <label htmlFor="review-title" className="block text-xs font-semibold text-slate-700">
                      Headline (Optional)
                    </label>
                    <input
                      id="review-title"
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      disabled={submitting}
                      placeholder="e.g. Structured aptitude and TCS preparation"
                      className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 transition-all disabled:opacity-50"
                    />
                  </div>

                  {/* Comment Textarea */}
                  <div className="space-y-1.5">
                    <label htmlFor="review-comment" className="block text-xs font-semibold text-slate-700">
                      Your Feedback & Recommendations <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      id="review-comment"
                      required
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      disabled={submitting}
                      placeholder="Tell us how RecruitReady has helped with your preparation..."
                      className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20 transition-all disabled:opacity-50 resize-y min-h-[90px]"
                    />
                  </div>

                  {/* Submit Actions */}
                  <div className="pt-2 space-y-2">
                    <Button
                      type="submit"
                      variant="primary"
                      fullWidth
                      loading={submitting}
                      disabled={submitting}
                    >
                      {submitting
                        ? isEditing
                          ? 'Updating Review...'
                          : 'Submitting Review...'
                        : isEditing
                        ? 'Update Review'
                        : 'Submit Review'}
                    </Button>

                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        fullWidth
                        onClick={handleCancelEdit}
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Public Approved Community Reviews */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Community Reviews
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              Moderated Student Feedback
            </span>
          </div>

          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, idx) => (
                <SkeletonCard key={idx} className="h-40" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6">
              <ErrorState
                title="Unable to load student reviews."
                message={error}
                onRetry={fetchApprovedReviews}
              />
            </div>
          ) : reviews.length === 0 ? (
            <EmptyState
              icon={<StarIcon className="w-8 h-8 text-amber-400" />}
              title="No student reviews yet"
              description="Be the first student to share your experience."
              action={
                <Button variant="primary" onClick={handleScrollToForm}>
                  Share Your Experience
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex items-center justify-between px-2 py-4 border-t border-slate-200">
                  <span className="text-xs text-slate-500 font-medium">
                    Page {pagination.page} of {pagination.pages} ({pagination.total} total)
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      iconLeft={<ChevronLeftIcon className="w-3.5 h-3.5" />}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.pages}
                      iconRight={<ChevronRightIcon className="w-3.5 h-3.5" />}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Your Review?"
        description="Are you sure you want to remove your review? This action cannot be undone."
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={deleting}
              onClick={handleDeleteConfirm}
            >
              Delete Review
            </Button>
          </>
        }
      >
        <p className="text-xs text-slate-600">
          Once deleted, your feedback will no longer be visible to administrators or other students. You will be able to submit a new review whenever you choose.
        </p>
      </Modal>
    </div>
  );
}
