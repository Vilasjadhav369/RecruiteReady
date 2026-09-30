/**
 * MetricCard — Compact metric display for dashboard preview UI.
 * Uses span elements (not p) to avoid global CSS cascade on p tags.
 *
 * @param {string} label
 * @param {string|number} value
 * @param {string} change - e.g. "+8% this week"
 * @param {boolean} positive - green vs amber trend color
 */
function MetricCard({ label, value, change, positive = true }) {
  return (
    <div className="bg-white border border-[#D9E2EC] rounded-lg p-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#52606D] block mb-1">{label}</span>
      <span className="text-xl font-bold text-[#172B4D] block mb-0.5">{value}</span>
      {change && (
        <span className={`text-[10px] font-medium block ${positive ? "text-green-600" : "text-amber-600"}`}>
          {change}
        </span>
      )}
    </div>
  );
}

export default MetricCard;
