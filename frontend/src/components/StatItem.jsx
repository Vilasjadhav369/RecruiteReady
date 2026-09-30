import LoadingSkeleton from "./LoadingSkeleton.jsx";

/**
 * StatItem — A single statistic display unit.
 * Designed to eventually receive live backend data.
 * Uses span elements to avoid global p-tag color cascade.
 *
 * @param {string} label - Metric label
 * @param {string|number|null} value - null triggers empty state
 * @param {React.ReactNode} icon - SVG icon element
 * @param {string} trend - Optional trend text
 * @param {boolean} loading
 */
function StatItem({ label, value, icon, trend, loading = false }) {
  return (
    <div className="flex flex-col items-start gap-1">
      {icon && (
        <div className="w-9 h-9 bg-[#E8F1FF] rounded-lg flex items-center justify-center mb-2 flex-shrink-0">
          {icon}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton className="h-8 w-24" />
      ) : value != null ? (
        <span className="text-3xl font-bold text-[#172B4D] tracking-tight">{value}</span>
      ) : (
        <span className="text-3xl font-bold text-[#D9E2EC]" title="Data will be available once connected to the database">—</span>
      )}

      <span className="text-sm font-medium text-[#172B4D] block">{label}</span>

      {trend && !loading && value != null && (
        <span className="text-xs text-green-600 font-medium block">{trend}</span>
      )}
    </div>
  );
}

export default StatItem;
