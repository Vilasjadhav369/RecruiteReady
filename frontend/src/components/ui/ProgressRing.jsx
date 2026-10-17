import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../../hooks/useReducedMotion.js";

/**
 * ProgressRing — circular progress with an animated sweep on mount/update.
 * `value` is 0–100. Children render in the centre (defaults to the percentage).
 */
export function ProgressRing({ value = 0, size = 64, stroke = 6, label, tone = "primary", children, className = "" }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const [shown, setShown] = useState(prefersReducedMotion() ? v : 0);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setShown(v);
      return undefined;
    }
    const id = requestAnimationFrame(() => setShown(v));
    return () => cancelAnimationFrame(id);
  }, [v]);

  const color = tone === "success" ? "var(--color-emerald-500, #10b981)" : "var(--color-primary)";
  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={label || `${Math.round(v)} percent`}
    >
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--color-slate-200)" strokeWidth={stroke} />
        <circle
          className="rr-ring-arc"
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - shown / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-slate-900 tabular">
        {children ?? `${Math.round(v)}%`}
      </span>
    </div>
  );
}
export default ProgressRing;
