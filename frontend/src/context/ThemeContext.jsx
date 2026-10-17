import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "../hooks/useReducedMotion.js";

const THEME_KEY = "rr_theme"; // "light" | "dark" | "paper" | "system"
const ACCENT_KEY = "rr_accent"; // "blue" | "violet" | "emerald" | "orange"
export const THEMES = ["light", "dark", "paper", "system"];
export const ACCENTS = ["blue", "violet", "emerald", "orange"];
const TEXT_KEY = "rr_text";
export const TEXT_SIZES = ["sm", "md", "lg"];
const META_COLOR = { light: "#0F1F3D", dark: "#0B1020", paper: "#F6F0E4" };

const ThemeContext = createContext(null);

const systemPrefersDark = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

const readKey = (key, allowed, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return allowed.includes(v) ? v : fallback;
  } catch {
    return fallback;
  }
};
const writeKey = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode) — preference lasts for this session */
  }
};
const resolve = (pref, sysDark) => (pref === "system" ? (sysDark ? "dark" : "light") : pref);

function applyToDom(resolved, accent, animate) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("rr-theme-anim");
    window.setTimeout(() => root.classList.remove("rr-theme-anim"), 350);
  }
  root.setAttribute("data-theme", resolved);
  if (accent && accent !== "blue") root.setAttribute("data-accent", accent);
  else root.removeAttribute("data-accent");
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[resolved] || META_COLOR.light);
}

/**
 * Runs `update` inside a circular-reveal View Transition when supported
 * (origin = the control that was clicked). Falls back to an instant update plus
 * the CSS colour cross-fade. Skipped entirely for reduced-motion users.
 */
function withReveal(update, origin) {
  const canTransition = typeof document.startViewTransition === "function" && !prefersReducedMotion();
  if (!canTransition) return false;
  const root = document.documentElement;
  const x = origin ? origin.x : window.innerWidth - 40;
  const y = origin ? origin.y : 40;
  root.style.setProperty("--rr-reveal-x", `${x}px`);
  root.style.setProperty("--rr-reveal-y", `${y}px`);
  root.style.setProperty("--rr-reveal-r", `${Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))}px`);
  document.startViewTransition(() => flushSync(update));
  return true;
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(() => readKey(THEME_KEY, THEMES, "system"));
  const [accent, setAccentState] = useState(() => readKey(ACCENT_KEY, ACCENTS, "blue"));
  const [textSize, setTextSizeState] = useState(() => readKey(TEXT_KEY, TEXT_SIZES, "md"));
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const resolved = resolve(preference, systemDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Keeps the DOM in sync for OS changes / first mount (no animation on first run).
  const isFirstRun = useRef(true);
  useEffect(() => {
    applyToDom(resolved, accent, !isFirstRun.current);
    isFirstRun.current = false;
  }, [resolved, accent]);

  const setTheme = useCallback(
    (next, origin) => {
      if (!THEMES.includes(next)) return;
      writeKey(THEME_KEY, next);
      const update = () => {
        applyToDom(resolve(next, systemPrefersDark()), accent, false);
        setPreference(next);
      };
      if (!withReveal(update, origin)) {
        applyToDom(resolve(next, systemPrefersDark()), accent, true);
        setPreference(next);
      }
    },
    [accent]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (textSize === "md") root.removeAttribute("data-text");
    else root.setAttribute("data-text", textSize);
  }, [textSize]);

  const setTextSize = useCallback((next) => {
    if (!TEXT_SIZES.includes(next)) return;
    writeKey(TEXT_KEY, next);
    setTextSizeState(next);
  }, []);

  const setAccent = useCallback(
    (next) => {
      if (!ACCENTS.includes(next)) return;
      writeKey(ACCENT_KEY, next);
      applyToDom(resolved, next, true);
      setAccentState(next);
    },
    [resolved]
  );

  const toggleTheme = useCallback(
    (origin) => setTheme(resolved === "dark" ? "light" : "dark", origin),
    [resolved, setTheme]
  );

  const value = useMemo(
    () => ({ preference, resolvedTheme: resolved, isDark: resolved === "dark", accent, textSize, setTheme, setAccent, setTextSize, toggleTheme }),
    [preference, resolved, accent, textSize, setTheme, setAccent, setTextSize, toggleTheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export default ThemeContext;
