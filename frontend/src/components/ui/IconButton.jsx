import React from 'react';
import { SpinnerIcon } from './Icons.jsx';

/**
 * IconButton — Compact, accessible icon-only button with restrained border radius.
 */
export function IconButton({
  icon,
  'aria-label': ariaLabel,
  variant = 'ghost',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  const base =
    'inline-flex items-center justify-center transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const variants = {
    ghost:
      'bg-transparent hover:bg-slate-100 active:bg-slate-200 text-slate-600 hover:text-slate-900',
    outline:
      'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 hover:border-slate-300 shadow-xs',
    primary:
      'bg-primary hover:bg-primary-dark text-white shadow-xs',
    secondary:
      'bg-slate-900 hover:bg-slate-800 text-white shadow-xs',
    danger:
      'bg-red-50 hover:bg-red-100 text-red-600 border border-red-200',
  };

  const sizes = {
    sm: 'w-7 h-7 rounded-md text-xs',
    md: 'w-8 h-8 rounded-lg text-sm',
    lg: 'w-10 h-10 rounded-lg text-base',
  };

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.ghost} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading ? <SpinnerIcon className="w-4 h-4 text-current" /> : icon}
    </button>
  );
}

export default IconButton;
