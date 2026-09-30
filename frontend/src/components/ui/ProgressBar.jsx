import React from 'react';

/**
 * ProgressBar — Accessible progress indicator with restrained radius and semantic colors.
 */
export function ProgressBar({
  value = 0,
  max = 100,
  variant = 'primary', // 'primary' | 'success' | 'warning' | 'danger'
  size = 'md',        // 'sm' | 'md' | 'lg'
  showLabel = false,
  label,
  className = '',
}) {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));

  const variants = {
    primary: 'bg-blue-600',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-red-600',
    navy: 'bg-slate-900',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2',
    lg: 'h-2.5',
  };

  return (
    <div className={`w-full space-y-1 ${className}`}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{label || 'Progress'}</span>
          <span className="font-semibold text-slate-700 font-mono">{percentage}%</span>
        </div>
      )}

      <div
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || `${percentage}% complete`}
        className={`w-full bg-slate-100 rounded-full ${sizes[size] || sizes.md} overflow-hidden`}
      >
        <div
          className={`${sizes[size] || sizes.md} ${
            variants[variant] || variants.primary
          } rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
