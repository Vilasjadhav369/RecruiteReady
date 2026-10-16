import { useEffect, useState } from "react";
import { prefersReducedMotion } from "../../hooks/useReducedMotion.js";

/**
 * TypingText — rotates through short phrases with a typing effect.
 * Reduced-motion users see the first phrase statically. The live region is
 * hidden from screen readers; an sr-only copy of all phrases is provided instead.
 */
export function TypingText({ phrases = [], typeMs = 55, deleteMs = 28, holdMs = 1600, className = "" }) {
  const [text, setText] = useState(prefersReducedMotion() ? phrases[0] || "" : "");
  const [idx, setIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!phrases.length || prefersReducedMotion()) return undefined;
    const full = phrases[idx % phrases.length];
    let timer;
    if (!deleting && text === full) timer = setTimeout(() => setDeleting(true), holdMs);
    else if (deleting && text === "") {
      setDeleting(false);
      setIdx((i) => (i + 1) % phrases.length);
    } else {
      timer = setTimeout(
        () => setText(full.slice(0, text.length + (deleting ? -1 : 1))),
        deleting ? deleteMs : typeMs
      );
    }
    return () => clearTimeout(timer);
  }, [text, deleting, idx, phrases, typeMs, deleteMs, holdMs]);

  return (
    <>
      <span className="sr-only">{phrases.join(". ")}</span>
      <span aria-hidden="true" className={className}>
        {text}
        {!prefersReducedMotion() && <span className="rr-caret" />}
      </span>
    </>
  );
}

export default TypingText;
