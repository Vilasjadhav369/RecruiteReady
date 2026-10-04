import React from 'react';

/**
 * Badge — Compact semantic badge with pill radius.
 */
export function Badge({
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
  children,
  ...props
}) {
  const base =
    'inline-flex items-center font-medium rounded-full select-none tracking-tight';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    neutral: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    brand: 'bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0]',
    primary: 'bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0]',
    secondary: 'bg-slate-900 text-white border border-slate-900',
    success: 'bg-emerald-50 text-emerald-800 border border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    danger: 'bg-red-50 text-red-800 border border-red-200/80',
    info: 'bg-sky-50 text-sky-800 border border-sky-200/80',
    outline: 'bg-transparent text-slate-700 border border-slate-300',
  };

  const dotColors = {
    default: 'bg-slate-500',
    neutral: 'bg-slate-500',
    brand: 'bg-[#22C55E]',
    primary: 'bg-[#22C55E]',
    secondary: 'bg-slate-300',
    success: 'bg-emerald-600',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    outline: 'bg-slate-500',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-0.5 gap-1.5',
    lg: 'text-xs px-3 py-1 gap-1.5 font-semibold',
  };

  return (
    <span
      className={`${base} ${variants[variant] || variants.default} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.default}`}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export default Badge;
