import { useEffect, useRef, useState } from "react";
import Accordion from "../ui/Accordion.jsx";

const GROUPS = [
  { title: "Global", defaultOpen: true, items: [["Ctrl / ⌘ + K", "Open command palette & search"], ["?", "Show this help"], ["Esc", "Close dialogs and menus"]] },
  { title: "Aptitude & mock tests", defaultOpen: true, items: [["← / →", "Previous / next question"], ["A–D or 1–4", "Select an option"], ["M", "Mark question for review"]] },
  { title: "Code editor", defaultOpen: false, items: [["Tab / Shift + Tab", "Indent / outdent"], ["Esc, then Tab", "Leave the editor (keyboard users)"], ["Enter", "Keeps current indentation"]] },
];

const isTyping = (el) => !!el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName));

/** Press "?" anywhere (outside inputs) to see the shortcuts that actually exist in the app. */
export default function ShortcutHelp() {
  const [open, setOpen] = useState(false);
  const closeRef = useRef(null);
  const lastFocus = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey && !e.altKey && !isTyping(e.target)) {
        e.preventDefault();
        lastFocus.current = document.activeElement;
        setOpen(true);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) closeRef.current?.focus();
    else lastFocus.current?.focus?.();
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[85] flex items-center justify-center p-4 bg-slate-900/50 animate-slide-in" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
      <div role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" className="w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-2xl p-5 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 m-0">Keyboard shortcuts</h2>
          <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Close shortcuts" className="w-8 h-8 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer">✕</button>
        </div>
        <div className="space-y-2">
          {GROUPS.map((g) => (
            <Accordion key={g.title} title={g.title} defaultOpen={g.defaultOpen}>
              <dl className="space-y-1.5 m-0">
                {g.items.map(([k, d]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dd className="m-0 text-slate-600">{d}</dd>
                    <dt><kbd className="px-1.5 py-0.5 rounded border border-slate-300 bg-slate-50 text-[11px] font-mono text-slate-700">{k}</kbd></dt>
                  </div>
                ))}
              </dl>
            </Accordion>
          ))}
        </div>
      </div>
    </div>
  );
}
