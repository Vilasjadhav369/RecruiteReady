import React from 'react';
import { SpinnerIcon } from './Icons.jsx';

/**
 * LoadingState — Centered loading indicator with clear message.
 */
export function LoadingState({
  message = 'Loading...',
  className = '',
  size = 'md',
}) {
  const spinnerSize = size === 'sm' ? 'w-5 h-5' : size === 'lg' ? 'w-8 h-8' : 'w-6 h-6';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 ${className}`}
      role="status"
      aria-live="polite"
    >
      <SpinnerIcon className={`${spinnerSize} text-primary mb-3`} />
      <span className="text-xs sm:text-sm font-medium text-slate-500">
        {message}
      </span>
    </div>
  );
}

export default LoadingState;
