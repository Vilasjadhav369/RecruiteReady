import { useEffect, useRef, useState } from "react";
import { useTheme, ACCENTS } from "../../context/ThemeContext.jsx";

const Icon = ({ children, className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const Sun = (p) => (<Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" /></Icon>);
const Moon = (p) => (<Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" /></Icon>);
const Book = (p) => (<Icon {...p}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M8 7h8M8 11h6" /></Icon>);
const Monitor = (p) => (<Icon {...p}><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></Icon>);

const OPTIONS = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "paper", label: "Warm Paper", Icon: Book },
  { value: "system", label: "System", Icon: Monitor },
];
const ACCENT_SWATCH = { blue: "#2563EB", violet: "#7C5CFC", emerald: "#059669", orange: "#EA580C" };
const ACCENT_LABEL = { blue: "Blue", violet: "Violet", emerald: "Emerald", orange: "Orange" };

/**
 * ThemeToggle — appearance menu: theme (Light / Dark / Warm Paper / System) and accent colour.
 * Disclosure pattern with a labelled radio group; closes on Escape / outside click and returns focus.
 */
export function ThemeToggle({ className = "" }) {
  const { preference, resolvedTheme, accent, textSize, setTheme, setAccent, setTextSize } = useTheme();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const btnRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const Current = resolvedTheme === "dark" ? Moon : resolvedTheme === "paper" ? Book : Sun;

  const choose = (value, e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTheme(value, { x: r.left + r.width / 2, y: r.top + r.height / 2 });
  };

  return (
    <div ref={wrapRef} className={`relative ${className}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label={`Appearance settings (current: ${resolvedTheme} theme)`}
        title="Appearance"
        className="inline-flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-primary hover:border-primary-border transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
      >
        <Current className="w-[18px] h-[18px]" />
      </button>

      {open && (
        <div
          role="group"
          aria-label="Appearance"
          className="animate-slide-in absolute right-0 top-full mt-2 w-60 rounded-xl border border-slate-200 bg-white shadow-xl p-3 z-[70] text-left"
        >
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1.5">Theme</p>
          <div role="radiogroup" aria-label="Theme" className="space-y-0.5">
            {OPTIONS.map(({ value, label, Icon: Ico }) => {
              const active = preference === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={(e) => choose(value, e)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors ${
                    active ? "bg-primary-soft text-primary" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <Ico className="w-4 h-4" />
                  <span className="flex-1 text-left">{label}</span>
                  {active && <span aria-hidden="true">✓</span>}
                </button>
              );
            })}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mt-3 mb-1.5">Accent colour</p>
          <div role="radiogroup" aria-label="Accent colour" className="flex gap-2 px-1 pb-1">
            {ACCENTS.map((a) => (
              <button
                key={a}
                type="button"
                role="radio"
                aria-checked={accent === a}
                aria-label={ACCENT_LABEL[a]}
                title={ACCENT_LABEL[a]}
                onClick={() => setAccent(a)}
                className={`w-7 h-7 rounded-full cursor-pointer transition-transform hover:scale-110 border-2 ${
                  accent === a ? "border-slate-900 scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: ACCENT_SWATCH[a] }}
              />
            ))}
          </div>

          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1 mt-3 mb-1.5">Text size</p>
          <div role="radiogroup" aria-label="Text size" className="flex gap-1.5 px-1 pb-1">
            {[["sm", "A−", "Smaller"], ["md", "A", "Default"], ["lg", "A+", "Larger"]].map(([v, t, label]) => (
              <button
                key={v}
                type="button"
                role="radio"
                aria-checked={textSize === v}
                aria-label={label}
                onClick={() => setTextSize(v)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-semibold border cursor-pointer transition-colors ${
                  textSize === v ? "bg-primary-soft text-primary border-primary-border" : "text-slate-600 border-slate-200 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeToggle;
