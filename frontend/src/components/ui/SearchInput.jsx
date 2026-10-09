import React, { forwardRef } from 'react';
import { SearchIcon, CloseIcon } from './Icons.jsx';

/**
 * SearchInput — Standardized search bar with search icon and clear button.
 */
export const SearchInput = forwardRef(function SearchInput(
  {
    value = '',
    onChange,
    onClear,
    placeholder = 'Search...',
    className = '',
    containerClassName = '',
    size = 'md',
    ...props
  },
  ref
) {
  const heightClass = size === 'sm' ? 'min-h-[36px] sm:min-h-0 h-8 text-xs' : 'min-h-[44px] sm:min-h-0 h-10 sm:h-9 text-sm';

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' } });
    }
  };

  return (
    <div className={`relative flex items-center ${containerClassName}`}>
      <div className="absolute left-3 text-slate-400 pointer-events-none flex items-center">
        <SearchIcon className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
      </div>

      <input
        ref={ref}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full ${heightClass} !pl-10 !pr-9 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all duration-150 ${className}`}
        {...props}
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded-md hover:bg-slate-100 transition-colors"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
});

export default SearchInput;
