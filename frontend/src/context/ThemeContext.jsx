import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "rr_theme"; // "light" | "dark" | "system" — kept separate from auth/app state
const ThemeContext = createContext(null);

const systemPrefersDark = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;

function readPreference() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === "light" || v === "dark" || v === "system" ? v : "system";
  } catch {
    return "system";
  }
}

function applyTheme(resolved, animate) {
  const root = document.documentElement;
  if (animate) {
    root.classList.add("rr-theme-anim");
    window.setTimeout(() => root.classList.remove("rr-theme-anim"), 350);
  }
  root.setAttribute("data-theme", resolved);
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", resolved === "dark" ? "#0B1020" : "#0F1F3D");
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(readPreference);
  const [systemDark, setSystemDark] = useState(systemPrefersDark);

  const resolved = preference === "system" ? (systemDark ? "dark" : "light") : preference;

  // Follow OS changes while the preference is "system".
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = (e) => setSystemDark(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Keep the DOM in sync (first run is the anti-flash script's value; no animation).
  const isFirstRun = useRef(true);
  useEffect(() => {
    applyTheme(resolved, !isFirstRun.current);
    isFirstRun.current = false;
  }, [resolved]);

  const setTheme = useCallback((next) => {
    setPreference(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode) — preference lasts for this session */
    }
  }, []);

  const toggleTheme = useCallback(() => setTheme(resolved === "dark" ? "light" : "dark"), [resolved, setTheme]);

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
