import { useEffect } from "react";
import { fireConfetti } from "../lib/confetti.js";

/**
 * Fires a single confetti burst the first time `shouldCelebrate` is true for a
 * given `key` in this browser session (so revisiting or refreshing a result
 * page never re-celebrates).
 */
export function useCelebrateOnce(key, shouldCelebrate) {
  useEffect(() => {
    if (!key || !shouldCelebrate) return undefined;
    const storageKey = `rr_celebrated_${key}`;
    try {
      if (sessionStorage.getItem(storageKey)) return undefined;
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* storage unavailable: still celebrate once for this mount */
    }
    const t = setTimeout(() => fireConfetti(), 350);
    return () => clearTimeout(t);
  }, [key, shouldCelebrate]);
}
