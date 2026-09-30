import React from 'react';

/**
 * EmptyState — Calm, academic empty state for sections or filters with zero results.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 bg-white border border-slate-200 rounded-xl ${className}`}
    >
      {icon && (
        <div className="w-12 h-12 bg-slate-100 text-slate-500 rounded-xl flex items-center justify-center mb-4 shrink-0">
          {icon}
        </div>
      )}

      {title && (
        <h4 className="text-sm sm:text-base font-semibold text-slate-800 tracking-tight mb-1">
          {title}
        </h4>
      )}

      {description && (
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed mb-5">
          {description}
        </p>
      )}

      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export default EmptyState;
