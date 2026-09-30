/**
 * ProgressBar — Accessible progress bar.
 *
 * @param {number} value - 0–100
 * @param {string} color - Tailwind bg class e.g. "bg-[#2563EB]"
 * @param {string} size - "sm" | "md"
 * @param {string} label - Accessible label
 */
function ProgressBar({ value = 0, color = "bg-[#2563EB]", size = "md", label }) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const heightClass = size === "sm" ? "h-1.5" : "h-2";

  return (
    <div
      className={`w-full bg-[#E8F1FF] rounded-full ${heightClass} overflow-hidden`}
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label ?? `${clampedValue}% complete`}
    >
      <div
        className={`${heightClass} ${color} rounded-full transition-all duration-500`}
        style={{ width: `${clampedValue}%` }}
      />
    </div>
  );
}

export default ProgressBar;
