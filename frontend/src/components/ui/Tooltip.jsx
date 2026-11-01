import React, { useState, useRef, useEffect } from 'react';

/**
 * Tooltip — Lightweight accessible CSS-based hover tooltip with optional delay.
 */
export function Tooltip({
  content,
  children,
  position = 'top', // 'top' | 'bottom' | 'left' | 'right'
  className = '',
  delay = 0,
}) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);

  const show = () => {
    if (delay > 0) {
      timeoutRef.current = setTimeout(() => setVisible(true), delay);
    } else {
      setVisible(true);
    }
  };

  const hide = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  if (!content) return children;

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-1.5',
    left: 'right-full top-1/2 -translate-y-1/2 mr-1.5',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && (
        <div
          role="tooltip"
          className={`absolute ${positions[position] || positions.top} z-50 px-2 py-1 text-[11px] font-medium text-surface bg-ink rounded border border-border/20 shadow-md whitespace-nowrap pointer-events-none transition-opacity duration-150 animate-fade-in`}
        >
          {content}
        </div>
      )}
    </div>
  );
}

export default Tooltip;
