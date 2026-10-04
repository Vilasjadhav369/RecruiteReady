import React from 'react';
import { StarIcon } from './ui/Icons.jsx';
import { formatDate } from '../utils/formatters.js';

/**
 * ReviewCard — Standard card displaying a single genuine, approved student review.
 * Backed strictly by real database records from GET /api/reviews.
 */
export function ReviewCard({ review }) {
  if (!review) return null;

  const authorName = review.author || review.studentName || 'Student';
  const initial = authorName.charAt(0).toUpperCase() || 'S';
  const text = review.comment || review.content || '';
  const dateStr = review.createdAt ? formatDate(review.createdAt) : null;
  const ratingNum = Math.min(5, Math.max(1, Number(review.rating) || 5));

  return (
    <div className="bg-white border border-slate-200/80 rounded-xl p-5 sm:p-6 shadow-xs hover:border-slate-300 transition-all duration-200 flex flex-col justify-between">
      <div className="space-y-3">
        {/* Header: Author Avatar & Name + Rating */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-9 h-9 rounded-full bg-[#DCFCE7] border border-[#BBF7D0] text-[#14532D] font-bold text-xs flex items-center justify-center shrink-0 select-none"
              aria-hidden="true"
            >
              {initial}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 truncate">
                {authorName}
              </h4>
              {review.college && (
                <p className="text-[11px] text-slate-500 truncate max-w-[200px]">
                  {review.college}
                </p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div
            className="flex items-center gap-0.5 text-amber-400 shrink-0"
            aria-label={`Rating: ${ratingNum} of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon
                key={star}
                filled={star <= ratingNum}
                className="w-4 h-4 text-amber-400"
              />
            ))}
          </div>
        </div>

        {/* Optional Headline */}
        {review.title && (
          <h5 className="text-sm font-semibold text-slate-900 pt-1">
            {review.title}
          </h5>
        )}

        {/* Comment Body */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {text}
        </p>
      </div>

      {/* Footer Timestamp */}
      {dateStr && (
        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>Verified Student Feedback</span>
          <span>{dateStr}</span>
        </div>
      )}
    </div>
  );
}

export default ReviewCard;
