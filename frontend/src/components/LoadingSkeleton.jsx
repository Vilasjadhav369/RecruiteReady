/**
 * LoadingSkeleton — Animated placeholder for loading states.
 *
 * @param {string} className - Tailwind classes for size/shape
 */
function LoadingSkeleton({ className = "" }) {
  return (
    <div
      className={`animate-pulse bg-[#E8F1FF] rounded ${className}`}
      aria-hidden="true"
    />
  );
}

/**
 * SkeletonCard — A full card-shaped skeleton.
 */
export function SkeletonCard() {
  return (
    <div className="bg-white border border-[#D9E2EC] rounded-xl p-6 space-y-3">
      <LoadingSkeleton className="h-10 w-10 rounded-lg" />
      <LoadingSkeleton className="h-5 w-3/4" />
      <LoadingSkeleton className="h-4 w-full" />
      <LoadingSkeleton className="h-4 w-5/6" />
    </div>
  );
}

export default LoadingSkeleton;
