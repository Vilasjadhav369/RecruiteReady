import { useId, useState } from "react";

/**
 * Accordion — a single disclosure with a smooth height transition (CSS grid-rows trick).
 * Fully keyboard accessible (it is a real <button> with aria-expanded / aria-controls).
 */
export function Accordion({ title, defaultOpen = false, children, className = "" }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <div className={`border border-slate-200 rounded-lg bg-white ${className}`}>
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 text-left text-sm font-semibold text-slate-800 cursor-pointer hover:bg-slate-50 rounded-lg"
        >
          {title}
          <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h3>
      <div id={id} role="region" data-open={open} className="rr-accordion" aria-hidden={!open}>
        <div inert={!open} className="px-3.5 pb-3 text-sm text-slate-600">{children}</div>
      </div>
    </div>
  );
}
export default Accordion;
