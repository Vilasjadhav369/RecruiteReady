import React, { useState, useEffect, useRef } from 'react';
import { getReviews, submitReview } from '../services/reviewService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
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
  SparklesIcon,
} from '../components/ui/Icons.jsx';

/**
 * Accessible Star Rating Selector
 * Supports mouse hover, keyboard selection, and screen readers.
 */
function RatingSelector({ value = 5, onChange, disabled = false }) {
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Review rating">
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = (hovered || value) >= star;
        return (
          <button
            type="button"
            key={star}
            disabled={disabled}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            aria-label={`${star} of 5 stars`}
            aria-checked={value === star}
            role="radio"
            className="p-1 rounded-md text-amber-400 hover:text-amber-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <StarIcon
              className="w-6 h-6 text-amber-400"
              filled={isFilled}
            />
          </button>
        );
      })}
      <span className="text-xs font-semibold text-slate-700 ml-2 font-mono">
        {hovered || value} / 5
      </span>
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Form State
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState(null);
  const [formError, setFormError] = useState(null);

  const formRef = useRef(null);

  const fetchApprovedReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getReviews({ page, limit: 10 });
      setReviews(data?.reviews || []);
      setPagination(data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      console.error('Failed to load student reviews:', err);
      setError('Unable to load student reviews. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovedReviews();
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setSubmitMessage(null);

    if (!comment.trim()) {
      setFormError('Please enter your feedback comments before submitting.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await submitReview({
        rating,
        title: title.trim(),
        comment: comment.trim(),
      });
      setSubmitMessage(
        res.message || 'Your review has been submitted and is awaiting moderation.'
      );
      setTitle('');
      setComment('');
      setRating(5);
    } catch (err) {
      console.error('Submit review error:', err);
      setFormError(err.response?.data?.message || 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
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
        description="Share your experience and help us improve RecruiteReady."
        breadcrumbs={breadcrumbs}
        badge={
          pagination.total > 0 ? (
            <Badge variant="default">
              {pagination.total} {pagination.total === 1 ? 'Approved Review' : 'Approved Reviews'}
            </Badge>
          ) : null
        }
        actions={
          <Button variant="primary" size="sm" onClick={handleScrollToForm}>
            Share Your Experience
          </Button>
        }
      />

      {/* Main Two-Column Layout: Form (Left) & Community Reviews (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Review Submission Form */}
        <div ref={formRef} className="lg:col-span-1">
          <Card className="border-slate-200/80 shadow-xs sticky lg:top-24">
            <CardHeader className="pb-3 border-b border-slate-100">
              <CardTitle className="text-base">Share Your Experience</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                All reviews undergo moderator review before appearing publicly.
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
                    placeholder="e.g. Great preparation for TCS NQT"
                    className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50"
                  />
                </div>

                {/* Comment Textarea */}
                <div className="space-y-1.5">
                  <label htmlFor="review-comment" className="block text-xs font-semibold text-slate-700">
                    Your Feedback & Advice <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="review-comment"
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={submitting}
                    placeholder="Share your interview preparation experience or recommendations for fellow students..."
                    className="w-full p-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all disabled:opacity-50 resize-y min-h-[90px]"
                  />
                </div>

                {/* Submit Action */}
                <Button
                  type="submit"
                  variant="primary"
                  fullWidth
                  loading={submitting}
                  disabled={submitting}
                  className="mt-2"
                >
                  {submitting ? 'Submitting Review...' : 'Submit Review'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Public Approved Community Reviews */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900">
              Community Reviews
            </h2>
            <span className="text-xs text-slate-400">
              Verified Candidate Feedback
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
              title="No student reviews yet."
              description="Be one of the first students to share your experience."
              action={
                <Button variant="primary" onClick={handleScrollToForm}>
                  Share Your Experience
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => {
                const authorInitial = r.author ? r.author.charAt(0).toUpperCase() : 'S';

                return (
                  <Card key={r._id} className="border-slate-200/80 shadow-xs">
                    <CardContent className="p-5 sm:p-6 space-y-3.5">
                      {/* Review Header: Author Info, Rating, Date */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                            {authorInitial}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900">
                              {r.author || 'Student'}
                            </h4>
                            <p className="text-[11px] text-slate-500 truncate max-w-xs">
                              {r.college || 'Engineering College'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* 5-Star Visualizer */}
                          <div className="flex items-center text-amber-400" aria-label={`Rating: ${r.rating} of 5 stars`}>
                            {[1, 2, 3, 4, 5].map((s) => (
                              <StarIcon
                                key={s}
                                className="w-4 h-4 text-amber-400"
                                filled={s <= r.rating}
                              />
                            ))}
                          </div>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Optional Review Title */}
                      {r.title && (
                        <h5 className="text-sm font-semibold text-slate-900 pt-0.5">
                          {r.title}
                        </h5>
                      )}

                      {/* Comment */}
                      <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                        {r.comment}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}

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
    </div>
  );
}
