import React, { useState } from 'react';

/**
 * Tooltip — Lightweight accessible CSS-based hover tooltip.
 */
export function Tooltip({
  content,
  children,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  className = '',
}) {
  const [visible, setVisible] = useState(false);

  if (!content) return children;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-1.5',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}

      {visible && (
        <div
          role="tooltip"
          className={`absolute ${positions[position] || positions.top} z-40 px-2 py-1 text-[11px] font-medium text-white bg-slate-900 rounded-md shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150 animate-fade-in`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
