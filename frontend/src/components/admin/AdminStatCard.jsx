import React from "react";

/**
 * AdminStatCard — Reusable, high-fidelity metric card for administrator consoles.
 * Strictly avoids NaN by safely parsing numeric values and nested metric objects.
 */
function AdminStatCard({
  title,
  value = 0,
  subtitle,
  icon: Icon,
  loading = false,
  error = null,
  className = "",
  onClick,
}) {
  if (loading) {
    return (
      <div className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 animate-pulse ${className}`}>
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 bg-slate-100 rounded-lg" />
          <div className="w-16 h-3 bg-slate-100 rounded" />
        </div>
        <div className="w-20 h-7 bg-slate-100 rounded" />
        <div className="w-28 h-3 bg-slate-100 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white border border-rose-200 rounded-xl p-5 shadow-xs ${className}`}>
        <span className="text-xs font-semibold text-rose-700 block">{title}</span>
        <span className="text-xs text-rose-500 mt-1 block">Data unavailable</span>
      </div>
    );
  }

  // Safe numeric extraction to guarantee NO NaN can ever render
  const formattedValue = (() => {
    if (value === null || value === undefined) return "—";

    let rawNumber = value;
    if (typeof value === "object" && value !== null) {
      rawNumber =
        value.total ??
        value.count ??
        value.questions ??
        value.problems ??
        value.active ??
        value.submissions ??
        value.attempts;
    }

    if (rawNumber === null || rawNumber === undefined) return "0";
    const parsed = Number(rawNumber);
    if (isNaN(parsed)) return "—";
    return parsed.toLocaleString();
  })();

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between transition-all duration-150 ${
        onClick ? "hover:border-slate-300 hover:shadow-sm cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            <Icon className="w-4 h-4 text-slate-700" />
          </div>
        )}
      </div>

      <div>
        <span className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight block font-mono">
          {formattedValue}
        </span>
        {subtitle && (
          <span className="text-xs text-slate-500 mt-1 block truncate">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default AdminStatCard;
