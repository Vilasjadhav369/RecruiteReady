import React from 'react';

/**
 * Card — Clean, structured surface with restrained border radius and subtle border.
 */
export function Card({
  variant = 'default',
  hoverable = false,
  className = '',
  children,
  onClick,
  ...props
}) {
  const isInteractive = variant === 'interactive' || hoverable || !!onClick;

  const variantStyles = {
    default: 'bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden',
    compact: 'bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden',
    elevated: 'bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden',
    interactive: 'bg-white border border-slate-200 rounded-xl shadow-xs hover:border-primary-border hover:shadow-sm transition-all duration-150 cursor-pointer overflow-hidden',
  };

  const interactiveClass = isInteractive && variant !== 'interactive'
    ? 'hover:border-primary-border hover:shadow-xs transition-all duration-150 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`${variantStyles[variant] || variantStyles.default} ${interactiveClass} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({ className = '', children, ...props }) {
  return (
    <h3
      className={`text-base font-semibold text-slate-900 tracking-tight ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({ className = '', children, ...props }) {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 leading-relaxed ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className = '', children, ...props }) {
  return (
    <div className={`p-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className = '', children, ...props }) {
  return (
    <div
      className={`px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-3 text-xs ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
