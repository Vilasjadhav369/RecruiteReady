import React from 'react';

/**
 * Divider — Structural horizontal or vertical separator with optional middle label.
 */
export function Divider({
  orientation = 'horizontal', // 'horizontal' | 'vertical'
  label,
  className = '',
}) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={`w-px h-full min-h-[16px] bg-slate-200 self-stretch ${className}`}
      />
    );
  }

  if (label) {
    return (
      <div className={`relative flex items-center w-full my-4 ${className}`}>
        <div className="flex-grow border-t border-slate-200" />
        <span className="shrink-0 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 bg-white">
          {label}
        </span>
        <div className="flex-grow border-t border-slate-200" />
      </div>
    );
  }

  return (
    <hr
      className={`border-t border-slate-200 my-4 w-full ${className}`}
      aria-hidden="true"
    />
  );
}

export default Divider;
