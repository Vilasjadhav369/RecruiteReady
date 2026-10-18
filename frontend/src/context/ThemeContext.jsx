import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { prefersReducedMotion } from "../hooks/useReducedMotion.js";

const THEME_KEY = "rr_theme"; // "light" | "dark" | "system" — kept separate from auth/app state
export const THEMES = ["light", "dark", "system"];
const META_COLOR = { light: "#FAFAFA", dark: "#0A0A0A" };

const ThemeContext = createContext(null);

const systemPrefersDark = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

const readPref = () => {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return THEMES.includes(v) ? v : "system";
  } catch {
    return "system";
  }
};
const resolve = (pref, sysDark) => (pref === "system" ? (sysDark ? "dark" : "light") : pref);

function applyToDom(resolved, animate) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("rr-theme-anim");
    window.setTimeout(() => root.classList.remove("rr-theme-anim"), 350);
  }
  root.setAttribute("data-theme", resolved);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", META_COLOR[resolved] || META_COLOR.light);
}

/**
 * Runs `update` inside a circular-reveal View Transition when supported (origin = the clicked
 * control). Falls back to an instant update + CSS colour cross-fade. Skipped for reduced motion.
 */
function withReveal(update, origin) {
  if (typeof document.startViewTransition !== "function" || prefersReducedMotion()) return false;
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
  const [preference, setPreference] = useState(readPref);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);
  const resolved = resolve(preference, systemDark);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const isFirstRun = useRef(true);
  useEffect(() => {
    applyToDom(resolved, !isFirstRun.current);
    isFirstRun.current = false;
  }, [resolved]);

  const setTheme = useCallback((next, origin) => {
    if (!THEMES.includes(next)) return;
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* storage unavailable — preference lasts for this session */
    }
    const update = () => {
      applyToDom(resolve(next, systemPrefersDark()), false);
      setPreference(next);
    };
    if (!withReveal(update, origin)) {
      applyToDom(resolve(next, systemPrefersDark()), true);
      setPreference(next);
    }
  }, []);

  const toggleTheme = useCallback((origin) => setTheme(resolved === "dark" ? "light" : "dark", origin), [resolved, setTheme]);

  const value = useMemo(
    () => ({ preference, resolvedTheme: resolved, isDark: resolved === "dark", setTheme, toggleTheme }),
    [preference, resolved, setTheme, toggleTheme]
  );
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

export default ThemeContext;
