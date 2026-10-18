import { Link } from "react-router-dom";
import { TypingText } from "../ui/TypingText.jsx";

const CHIPS = ["Aptitude", "Coding", "Mock Tests", "Company Tracks", "Study Materials"];
const PHRASES = [
  "Aptitude practice that tracks your speed.",
  "Timed mock tests that feel like the real thing.",
  "Company tracks built around real hiring rounds.",
];

/** Landing hero: abstract animated grid + soft drifting glows, one bold headline, no fake product mockup. */
export default function HeroAbstract({ primaryTo, primaryLabel }) {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0">
        <div className="rr-grid-bg absolute inset-0" />
        <div className="rr-drift-a absolute -top-24 left-[12%] w-[28rem] h-[28rem] rounded-full blur-3xl opacity-40" style={{ background: "radial-gradient(circle, var(--rr-glow-1), transparent 65%)" }} />
        <div className="rr-drift-b absolute top-10 right-[8%] w-[26rem] h-[26rem] rounded-full blur-3xl opacity-35" style={{ background: "radial-gradient(circle, var(--rr-glow-2), transparent 65%)" }} />
        <div className="rr-drift-a absolute bottom-0 left-[40%] w-[22rem] h-[22rem] rounded-full blur-3xl opacity-25" style={{ background: "radial-gradient(circle, var(--rr-glow-3), transparent 65%)" }} />
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-14 sm:pt-16 pb-14 sm:pb-16 text-center animate-slide-in">
        <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 backdrop-blur px-3.5 py-1.5 text-xs font-semibold text-slate-700">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Campus Placement Portal · Academic Year 2025–2026
        </span>
        <h1 className="mt-6 text-[2.4rem] sm:text-5xl lg:text-[4.4rem] font-semibold tracking-tight text-slate-900 leading-[1] text-balance">
          {["Prepare", "smarter."].map((w, i) => (
            <span key={w} className="rr-word mr-[0.25em]" style={{ "--w": i }}>{w}</span>
          ))}
          <br />
          <span className="text-slate-400">
            {["Get", "placement", "ready."].map((w, i) => (
              <span key={w} className="rr-word mr-[0.25em]" style={{ "--w": i + 2 }}>{w}</span>
            ))}
          </span>
        </h1>
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto text-balance">
          Practice aptitude, solve coding problems, take timed mock tests and study each recruiter’s hiring pattern, all in one place.
        </p>
        <p className="mt-3 h-6 text-sm sm:text-base font-semibold text-slate-900">
          <TypingText phrases={PHRASES} />
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link to={primaryTo} className="px-6 py-3 rounded-lg bg-primary text-white font-semibold no-underline hover:bg-primary-dark transition-colors">
            {primaryLabel} →
          </Link>
          <Link to="/companies" className="px-6 py-3 rounded-lg border border-slate-300 bg-white/80 backdrop-blur text-slate-900 font-semibold no-underline hover:border-slate-900 transition-colors">
            Explore recruiter tracks
          </Link>
        </div>
        <div className="mt-9 flex flex-wrap justify-center gap-2">
          {CHIPS.map((c) => (
            <span key={c} className="rounded-full border border-slate-200 bg-white/70 backdrop-blur px-3.5 py-1 text-sm font-medium text-slate-700">{c}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
