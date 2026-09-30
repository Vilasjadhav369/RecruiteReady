import React from 'react';

/**
 * Card — Clean, structured surface with restrained border radius and subtle border.
 */
export function Card({
  className = '',
  children,
  onClick,
  hoverable = false,
  ...props
}) {
  const hoverClass = hoverable
    ? 'hover:border-slate-300 hover:shadow-xs transition-all duration-150 cursor-pointer'
    : '';

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden ${hoverClass} ${className}`}
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
