import React, { forwardRef } from 'react';
import { ChevronDownIcon } from './Icons.jsx';

/**
 * Select — Styled select element with consistent height and custom chevron.
 */
export const Select = forwardRef(function Select(
  {
    label,
    id,
    name,
    error,
    helperText,
    required = false,
    disabled = false,
    options = [],
    placeholder,
    className = '',
    containerClassName = '',
    children,
    ...props
  },
  ref
) {
  const selectId = id || name || `select-${Math.random().toString(36).substr(2, 9)}`;

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
          htmlFor={selectId}
          className="block text-xs font-semibold text-slate-700 tracking-tight"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        <select
          ref={ref}
          id={selectId}
          name={name}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${selectId}-error` : helperText ? `${selectId}-helper` : undefined}
          className={`w-full h-9 pl-3 pr-8 text-sm rounded-lg border appearance-none transition-all duration-150 outline-none cursor-pointer ${borderClass} ${disabledClass} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.length > 0
            ? options.map((opt) => {
                const value = typeof opt === 'object' ? opt.value : opt;
                const label = typeof opt === 'object' ? opt.label : opt;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })
            : children}
        </select>

        <div className="absolute right-2.5 text-slate-400 pointer-events-none flex items-center">
          <ChevronDownIcon className="w-4 h-4" />
        </div>
      </div>

      {error ? (
        <p id={`${selectId}-error`} className="text-xs text-red-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${selectId}-helper`} className="text-xs text-slate-500">
          {helperText}
        </p>
      ) : null}
    </div>
  );
});

export default Select;
