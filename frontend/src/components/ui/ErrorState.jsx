import React from 'react';
import { AlertCircleIcon, RefreshIcon } from './Icons.jsx';
import { Button } from './Button.jsx';

/**
 * ErrorState — Clear error feedback with explanation and optional retry action.
 */
export function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to complete this request. Please verify your connection and try again.',
  onRetry,
  className = '',
}) {
  return (
    <div
      className={`p-6 sm:p-8 bg-red-50/50 border border-red-200/80 rounded-xl text-center flex flex-col items-center justify-center ${className}`}
      role="alert"
    >
      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
        <AlertCircleIcon className="w-5 h-5" />
      </div>

      <h4 className="text-sm sm:text-base font-semibold text-red-950 mb-1">
        {title}
      </h4>

      <p className="text-xs sm:text-sm text-red-700 max-w-md leading-relaxed mb-4">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          iconLeft={<RefreshIcon className="w-3.5 h-3.5" />}
          className="border-red-300 text-red-700 hover:bg-red-100/50"
        >
          Try Again
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
