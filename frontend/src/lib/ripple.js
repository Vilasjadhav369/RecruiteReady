import { prefersReducedMotion } from "../hooks/useReducedMotion.js";

/** Material-style click ripple. Pure DOM, self-removing, skipped for reduced motion. */
export function createRipple(event) {
  if (prefersReducedMotion()) return;
  const el = event.currentTarget;
  if (!el || el.disabled || el.getAttribute("aria-disabled") === "true") return;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 2;
  const span = document.createElement("span");
  span.className = "rr-ripple";
  span.style.width = span.style.height = `${size}px`;
  span.style.left = `${event.clientX - rect.left - size / 2}px`;
  span.style.top = `${event.clientY - rect.top - size / 2}px`;
  el.appendChild(span);
  span.addEventListener("animationend", () => span.remove(), { once: true });
}
