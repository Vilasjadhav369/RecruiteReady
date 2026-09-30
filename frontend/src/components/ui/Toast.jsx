import React from 'react';
import { CheckCircleIcon, AlertTriangleIcon, AlertCircleIcon, InfoIcon, CloseIcon } from './Icons.jsx';
import { IconButton } from './IconButton.jsx';

/**
 * Toast — Semantic notification alert with solid border and dismiss action.
 */
export function Toast({
  variant = 'info', // 'success' | 'warning' | 'error' | 'info'
  title,
  message,
  onClose,
  className = '',
}) {
  const configs = {
    success: {
      bg: 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900',
      icon: <CheckCircleIcon className="w-5 h-5 text-emerald-600" />,
    },
    warning: {
      bg: 'bg-amber-50/90 border-amber-200/80 text-amber-900',
      icon: <AlertTriangleIcon className="w-5 h-5 text-amber-600" />,
    },
    error: {
      bg: 'bg-red-50/90 border-red-200/80 text-red-900',
      icon: <AlertCircleIcon className="w-5 h-5 text-red-600" />,
    },
    info: {
      bg: 'bg-blue-50/90 border-blue-200/80 text-blue-900',
      icon: <InfoIcon className="w-5 h-5 text-blue-600" />,
    },
  };

  const current = configs[variant] || configs.info;

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 p-3.5 border rounded-xl shadow-sm ${current.bg} ${className}`}
    >
      <div className="shrink-0 mt-0.5">{current.icon}</div>

      <div className="flex-1 min-w-0">
        {title && (
          <h5 className="text-xs sm:text-sm font-semibold tracking-tight mb-0.5">
            {title}
          </h5>
        )}
        {message && (
          <p className="text-xs leading-relaxed opacity-90">{message}</p>
        )}
      </div>

      {onClose && (
        <IconButton
          icon={<CloseIcon className="w-3.5 h-3.5" />}
          aria-label="Dismiss notification"
          size="sm"
          onClick={onClose}
          className="text-current opacity-60 hover:opacity-100 -mr-1 -mt-1"
        />
      )}
    </div>
  );
}

export default Toast;
