import { useTheme } from "../../context/ThemeContext.jsx";

const Sun = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </svg>
);
const Moon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
  </svg>
);

/**
 * ThemeToggle — icon button that flips light/dark. The icons cross-fade/rotate
 * via CSS transforms. `onDark` is for placement over the dark public navbar.
 */
export function ThemeToggle({ className = "" }) {
  const { isDark, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      title={isDark ? "Light theme" : "Dark theme"}
      className={`relative inline-flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-primary hover:border-primary-border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${className}`}
    >
      <Sun className={`absolute w-[18px] h-[18px] transition-all duration-300 ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`} />
      <Moon className={`absolute w-[18px] h-[18px] transition-all duration-300 ${isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} />
    </button>
  );
}

export default ThemeToggle;
