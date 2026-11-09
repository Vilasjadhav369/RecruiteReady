import { LogoSymbol } from "../common/Logo.jsx";
import React from 'react';

/**
 * LoadingState — Centered loading indicator with clear message.
 */
export function LoadingState({
  message = 'Loading...',
  className = '',
  size = 'md',
}) {
  const _spinnerSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="animate-pulse mb-3 flex items-center justify-center"><LogoSymbol size={size === "sm" ? 24 : size === "lg" ? 44 : 32} /></div>
      <span className="text-xs sm:text-sm font-medium text-ink-2">
        {message}
      </span>
    </div>
  );
}

export default LoadingState;
