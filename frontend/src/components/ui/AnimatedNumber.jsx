import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "../../hooks/useReducedMotion.js";
import { useInView } from "../../hooks/useInView.js";

/**
 * AnimatedNumber — counts from 0 to `value` once when first visible.
 * Renders the final value immediately for reduced-motion users or non-numeric input.
 */
export function AnimatedNumber({ value, duration = 900, decimals = 0, suffix = "", prefix = "", className = "" }) {
  const target = Number(value);
  const valid = Number.isFinite(target);
  const [ref, inView] = useInView({ threshold: 0.3 });
  const [display, setDisplay] = useState(valid && !prefersReducedMotion() ? 0 : target);
  const raf = useRef(0);

  useEffect(() => {
    if (!valid) return undefined;
    if (prefersReducedMotion()) {
      setDisplay(target);
      return undefined;
    }
    if (!inView) return undefined;
    const start = performance.now();
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(target * eased);
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, valid, inView, duration]);

  if (!valid) return <span ref={ref} className={className}>{value ?? "—"}</span>;
  return (
    <span ref={ref} className={`tabular ${className}`}>
      {prefix}{display.toFixed(decimals)}{suffix}
    </span>
  );
}

export default AnimatedNumber;
