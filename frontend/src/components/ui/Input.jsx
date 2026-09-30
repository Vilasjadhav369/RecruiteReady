import React, { forwardRef } from 'react';

/**
 * Input — Professional form text input with accessible label, error, helper text, and icons.
 */
export const Input = forwardRef(function Input(
  {
    label,
    id,
    name,
    type = 'text',
    error,
    helperText,
    prefixIcon,
    suffixIcon,
    required = false,
    disabled = false,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

  const borderClass = error
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'border-slate-200 text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

  const disabledClass = disabled
    ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200'
    : 'bg-white';

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {prefixIcon && (
          <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
            {prefixIcon}
          </div>
        )}

        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full h-9 text-sm rounded-lg border transition-all duration-150 outline-none ${borderClass} ${disabledClass} ${
            prefixIcon ? 'pl-9' : 'pl-3'
          } ${suffixIcon ? 'pr-9' : 'pr-3'} placeholder:text-slate-400 ${className}`}
          {...props}
        />

        {suffixIcon && (
          <div className="absolute right-3 text-slate-400 flex items-center">
            {suffixIcon}
          </div>
        )}
      </div>

      {error ? (
        <p id={`${inputId}-error`} className="text-xs text-red-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${inputId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Input;
