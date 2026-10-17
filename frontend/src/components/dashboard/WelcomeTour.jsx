import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext.jsx";
import { Button } from "../ui/Button.jsx";

const STEPS = [
  { title: "Start with a diagnostic", body: "Take a short aptitude session first. Your results unlock topic-wise analysis and tailored recommendations." },
  { title: "Pick your target companies", body: "Add companies from your profile or the Companies page to see their preparation tracks and eligibility checks." },
  { title: "Find anything fast", body: "Press Ctrl/⌘ + K to search or jump to any page, and press ? to see keyboard shortcuts. Change theme and accent from the appearance menu in the header." },
];

/** First-run tour: shown once per user on this device, skippable, focus-managed. */
export default function WelcomeTour() {
  const { user } = useAuth();
  const uid = user?._id || user?.id;
  const key = uid ? `rr_tour_done_${uid}` : null;
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);
  const nextRef = useRef(null);

  useEffect(() => {
    if (!key) return;
    try {
      if (!localStorage.getItem(key)) setOpen(true);
    } catch {
      /* storage blocked: skip the tour rather than show it every time */
    }
  }, [key]);

  useEffect(() => {
    if (open) nextRef.current?.focus();
  }, [open, step]);

  const finish = () => {
    try {
      localStorage.setItem(key, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === "Escape" && finish();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  const last = step === STEPS.length - 1;
  return (
    <div className="fixed inset-0 z-[88] flex items-end sm:items-center justify-center p-4 bg-slate-900/50 animate-slide-in">
      <div role="dialog" aria-modal="true" aria-labelledby="tour-title" className="w-full max-w-sm rounded-2xl bg-white border border-slate-200 shadow-2xl p-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-1">Quick tour · {step + 1} of {STEPS.length}</p>
        <h2 id="tour-title" className="text-lg font-bold text-slate-900 m-0 mb-1.5">{STEPS[step].title}</h2>
        <p className="text-sm text-slate-600 leading-relaxed mb-4">{STEPS[step].body}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5" aria-hidden="true">
            {STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-5 bg-primary" : "w-1.5 bg-slate-300"}`} />)}
          </div>
          <div className="flex items-center gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={finish}>Skip</Button>
            <button ref={nextRef} type="button" onClick={() => (last ? finish() : setStep((s) => s + 1))} className="px-3.5 py-1.5 rounded-lg bg-primary text-white text-sm font-semibold cursor-pointer hover:bg-primary-dark transition-colors">
              {last ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
