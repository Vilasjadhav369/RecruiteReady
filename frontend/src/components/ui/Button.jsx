import React from 'react';
import { Link } from 'react-router-dom';
import { SpinnerIcon } from './Icons.jsx';

/**
 * Button — Universal Apple/Linear styled button primitive.
 * Focus ring, restrained radius, solid semantic colors, subtle transitions.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  iconLeft,
  iconRight,
  type = 'button',
  to,
  className = '',
  children,
  onClick,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center font-medium transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.99] cursor-pointer';

  const variants = {
    primary:
      'bg-primary hover:bg-primary-dark active:bg-primary-darker text-white shadow-xs border border-primary',
    brand:
      'bg-primary hover:bg-primary-dark active:bg-primary-darker text-white shadow-xs border border-primary',
    secondary:
      'bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white shadow-xs border border-slate-900',
    outline:
      'bg-white hover:bg-emerald-50/50 active:bg-emerald-100/50 text-slate-800 border border-slate-200 shadow-xs hover:border-emerald-300',
    ghost:
      'bg-transparent hover:bg-emerald-50 active:bg-emerald-100 text-slate-700 hover:text-primary',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-xs border border-red-600',
    success:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white shadow-xs border border-emerald-600',
    'outline-white':
      'border border-white/30 text-white bg-transparent hover:bg-white/10',
  };

  const sizes = {
    sm: 'min-h-[36px] sm:min-h-0 h-8 px-3 text-xs gap-1.5 rounded-md',
    md: 'min-h-[44px] sm:min-h-0 h-10 sm:h-9 px-4 text-sm gap-2 rounded-lg',
    lg: 'min-h-[44px] h-11 px-5 text-sm sm:text-base gap-2.5 rounded-lg',
  };

  const classes = `${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${fullWidth ? 'w-full' : ''} ${className} ${to ? 'no-underline hover:no-underline' : ''}`;

  if (to) {
    return (
      <Link to={to} className={classes} onClick={onClick} {...props}>
        {iconLeft && <span className="shrink-0">{iconLeft}</span>}
        <span>{children}</span>
        {iconRight && <span className="shrink-0">{iconRight}</span>}
      </Link>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={classes}
      {...props}
    >
      {loading ? (
        <SpinnerIcon className="w-4 h-4 text-current" />
      ) : (
        iconLeft && <span className="shrink-0">{iconLeft}</span>
      )}
      <span>{children}</span>
      {!loading && iconRight && <span className="shrink-0">{iconRight}</span>}
    </button>
  );
}

export default Button;
