import { useInView } from "../../hooks/useInView.js";

/**
 * Reveal — fade/slide children in when they scroll into view.
 * Pure CSS transition (opacity + transform). `delay` in ms for manual staggering.
 */
export function Reveal({ as: Tag = "div", direction = "up", delay = 0, className = "", children, ...rest }) {
  const [ref, inView] = useInView();
  return (
    <Tag
      ref={ref}
      data-dir={direction === "up" ? undefined : direction}
      style={{ "--rr-delay": `${delay}ms` }}
      className={`rr-reveal ${inView ? "is-visible" : ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
