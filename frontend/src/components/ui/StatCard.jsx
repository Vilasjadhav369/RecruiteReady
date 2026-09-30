import React from 'react';
import { Card } from './Card.jsx';

/**
 * StatCard — Premium metric card for platform and progress numbers.
 * Strictly accepts real data values — never fabricates mock numbers.
 */
export function StatCard({
  label,
  value,
  subtext,
  change,
  positive = true,
  icon,
  className = '',
  onClick,
}) {
  const displayValue = value !== undefined && value !== null ? value : '—';

  return (
    <Card
      onClick={onClick}
      hoverable={!!onClick}
      className={`p-4 sm:p-5 flex flex-col justify-between ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
          {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
        </div>

        <div className="mt-1 flex items-center gap-2 flex-wrap">
          {change && (
            <span
              className={`text-xs font-semibold ${
                positive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {change}
            </span>
          )}
          {subtext && (
            <span className="text-xs text-slate-500 truncate max-w-full">
              {subtext}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
