import React from 'react';
import { ProgressBar as UiProgressBar } from './ui/ProgressBar.jsx';

/**
 * ProgressBar — Compatibility wrapper delegating to authoritative ui/ProgressBar.
 */
export function ProgressBar({ value = 0, color, size = 'md', label, ...props }) {
  return (
    <UiProgressBar
      value={value}
      color={color}
      size={size}
      label={label}
      {...props}
    />
  );
}

export default ProgressBar;
