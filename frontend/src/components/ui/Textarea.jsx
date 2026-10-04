import React, { forwardRef } from 'react';

/**
 * Textarea — Multiline text input with character count and accessible feedback.
 */
export const Textarea = forwardRef(function Textarea(
  {
    label,
    id,
    name,
    error,
    helperText,
    required = false,
    disabled = false,
    rows = 3,
    maxLength,
    value,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const textareaId = id || name || `textarea-${Math.random().toString(36).substr(2, 9)}`;

  const borderClass = error
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'border-slate-200 text-slate-900 focus:border-[#166534] focus:ring-2 focus:ring-[#166534]/20';

  const disabledClass = disabled
    ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200'
    : 'bg-white';

  const currentLength = typeof value === 'string' ? value.length : 0;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      <div className="flex items-center justify-between">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
          </label>
        )}
        {maxLength && (
          <span className="text-[11px] text-slate-400">
            {currentLength}/{maxLength}
          </span>
        )}
      </div>

      <textarea
        ref={ref}
        id={textareaId}
        name={name}
        rows={rows}
        maxLength={maxLength}
        value={value}
        disabled={disabled}
        required={required}
        aria-invalid={!!error}
        aria-describedby={error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined}
        className={`w-full p-3 text-sm rounded-lg border transition-all duration-150 outline-none resize-y placeholder:text-slate-400 ${borderClass} ${disabledClass} ${className}`}
        {...props}
      />

      {error ? (
        <p id={`${textareaId}-error`} className="text-xs text-red-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${textareaId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Textarea;
