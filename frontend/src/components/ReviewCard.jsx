/**
 * ReviewCard — Displays a single approved student review.
 * Architecture ready for GET /api/reviews (admin-moderated only).
 *
 * @param {Object} review - { content, studentName, branch, placedAt, rating }
 */
function ReviewCard({ review }) {
  if (!review) return null;

  const stars = Array.from({ length: 5 }, (_, i) => i < (review.rating ?? 0));

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 hover:shadow-sm transition-shadow duration-200 flex flex-col">
      {/* Star rating */}
      <div className="flex items-center gap-0.5 mb-4" aria-label={`${review.rating} out of 5 stars`}>
        {stars.map((filled, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill={filled ? "#C9A227" : "none"} aria-hidden="true">
            <path d="M7 1L8.545 5.09H12.99L9.47 7.66L10.99 11.75L7 9.09L3.01 11.75L4.53 7.66L1.01 5.09H5.455L7 1Z" stroke="#C9A227" strokeWidth="0.75"/>
          </svg>
        ))}
      </div>

      {/* Review content */}
      <span className="text-[#172B4D] text-sm leading-relaxed block mb-4 flex-1">&ldquo;{review.content}&rdquo;</span>

      {/* Student info */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#E8F1FF] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-bold text-[#2563EB]">{review.studentName?.[0] ?? "?"}</span>
        </div>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-semibold text-[#172B4D] block">{review.studentName}</span>
          {review.branch && (
            <span className="text-xs text-[#52606D] block">{review.branch}</span>
          )}
        </div>
        {review.placedAt && (
          <span className="text-[10px] font-semibold text-[#52606D] bg-[#F8FAFC] border border-[#D9E2EC] px-2 py-1 rounded flex-shrink-0">
            Placed at {review.placedAt}
          </span>
        )}
      </div>
    </div>
  );
}

export default ReviewCard;
