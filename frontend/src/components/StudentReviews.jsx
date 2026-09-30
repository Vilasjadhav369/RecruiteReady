import ReviewCard from "./ReviewCard.jsx";
import EmptyState from "./EmptyState.jsx";
import LoadingSkeleton from "./LoadingSkeleton.jsx";
import { Link } from "react-router-dom";

/**
 * StudentReviews — Renders approved student reviews.
 * Connects to GET /api/reviews (Phase 3+ — admin moderated).
 *
 * STRICT RULE: Never display invented reviews.
 * Empty array shows no-reviews empty state.
 *
 * @param {Array} reviews - Approved reviews from API
 * @param {boolean} loading
 */
function StudentReviews({ reviews = [], loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white border border-[#D9E2EC] rounded-xl p-6 space-y-3">
            <LoadingSkeleton className="h-4 w-20" />
            <LoadingSkeleton className="h-4 w-full" />
            <LoadingSkeleton className="h-4 w-3/4" />
            <LoadingSkeleton className="h-4 w-full" />
            <div className="flex items-center gap-3 pt-2">
              <LoadingSkeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <LoadingSkeleton className="h-3 w-24" />
                <LoadingSkeleton className="h-3 w-16" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="border border-dashed border-[#D9E2EC] rounded-xl py-16">
        <EmptyState
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 6a2 2 0 012-2h8a2 2 0 012 2v6a2 2 0 01-2 2H6l-4 3V6z" stroke="#2563EB" strokeWidth="1.5" strokeLinejoin="round"/>
            </svg>
          }
          title="No student reviews yet."
          description="Student reviews will appear here once submitted and approved by our team."
          action={
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] transition-colors"
            >
              Share Your Experience
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {reviews.map((review) => (
        <ReviewCard key={review._id ?? review.id} review={review} />
      ))}
    </div>
  );
}

export default StudentReviews;
