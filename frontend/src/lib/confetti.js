import { prefersReducedMotion } from "../hooks/useReducedMotion.js";

/**
 * Tiny dependency-free confetti burst. One canvas, one rAF loop, removed when done.
 * No-op for reduced-motion users. Call once per meaningful event.
 */
export function fireConfetti({ count = 110, duration = 2200 } = {}) {
  if (typeof document === "undefined" || prefersReducedMotion()) return;
  if (document.querySelector(".rr-confetti")) return;

  const canvas = document.createElement("canvas");
  canvas.className = "rr-confetti";
  canvas.setAttribute("aria-hidden", "true");
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);

  const colors = ["#2563EB", "#38BDF8", "#7C5CFC", "#34D399", "#FBBF24", "#FB7185"];
  const w = window.innerWidth;
  const parts = Array.from({ length: count }, () => ({
    x: w / 2 + (Math.random() - 0.5) * 120,
    y: window.innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 11,
    vy: -Math.random() * 11 - 3,
    size: Math.random() * 6 + 4,
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
    color: colors[(Math.random() * colors.length) | 0],
  }));

  const start = performance.now();
  let raf = 0;
  const frame = (now) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const fade = Math.max(0, 1 - Math.max(0, elapsed - duration * 0.6) / (duration * 0.4));
    for (const p of parts) {
      p.vy += 0.28;
      p.vx *= 0.992;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.globalAlpha = fade;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      ctx.restore();
    }
    if (elapsed < duration) raf = requestAnimationFrame(frame);
    else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  };
  raf = requestAnimationFrame(frame);
}

export default fireConfetti;
