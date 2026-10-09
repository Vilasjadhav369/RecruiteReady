import React, { forwardRef, useState, useId } from 'react';
import { EyeIcon, EyeOffIcon } from './Icons.jsx';

/**
 * Input — Professional form text input with accessible label, error, helper text, and icons.
 * Automatically provides accessible show/hide password toggle for type="password".
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
    showPasswordToggle = true,
    className = '',
    containerClassName = '',
    ...props
  },
  ref
) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword && showPassword ? 'text' : type;

  const generatedId = useId();
  const inputId = id || name || `input-${generatedId}`;

  const borderClass = error
    ? 'border-red-300 text-red-900 focus:border-red-500 focus:ring-2 focus:ring-red-500/20'
    : 'border-slate-200 text-slate-900 focus:border-primary focus:ring-2 focus:ring-primary/20';

  const disabledClass = disabled
    ? 'bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200'
    : 'bg-white';

  const hasSuffix = (isPassword && showPasswordToggle) || Boolean(suffixIcon);

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
          type={effectiveType}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          className={`w-full min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-sm rounded-lg border transition-all duration-150 outline-none ${borderClass} ${disabledClass} ${
            prefixIcon ? 'pl-10' : 'pl-3'
          } ${hasSuffix ? 'pr-10' : 'pr-3'} placeholder:text-slate-400 ${className}`}
          {...props}
        />

        {isPassword && showPasswordToggle ? (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            title={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            {showPassword ? (
              <EyeOffIcon className="w-4 h-4 text-slate-500" />
            ) : (
              <EyeIcon className="w-4 h-4 text-slate-500" />
            )}
          </button>
        ) : suffixIcon ? (
          <div className="absolute right-3 text-slate-400 flex items-center">
            {suffixIcon}
          </div>
        ) : null}
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
