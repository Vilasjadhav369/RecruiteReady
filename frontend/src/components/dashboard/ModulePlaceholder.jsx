import { Link } from "react-router-dom";

/**
 * ModulePlaceholder — Clean placeholder view for modules slated for subsequent phases.
 * Maintains the dashboard shell and visual consistency without broken links.
 */
function ModulePlaceholder({ title, description, phase = "Upcoming Phase" }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-12">
      <div className="w-14 h-14 rounded-2xl bg-primary-tint border border-primary-border flex items-center justify-center text-primary mb-5 shadow-xs">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 3" />
        </svg>
      </div>

      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary-tint text-primary-dark mb-3">
        <span>{phase}</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-3 tracking-tight">
        {title}
      </h1>

      <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 leading-relaxed">
        {description}
      </p>

      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-primary hover:bg-primary-dark px-5 py-2.5 rounded-lg transition-colors no-underline shadow-xs"
      >
        <span>Return to Dashboard</span>
      </Link>
    </div>
  );
}

export default ModulePlaceholder;
