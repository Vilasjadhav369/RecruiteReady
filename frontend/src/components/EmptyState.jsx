import React from 'react';
import { EmptyState as UiEmptyState } from './ui/EmptyState.jsx';

/**
 * EmptyState — Compatibility wrapper delegating to authoritative ui/EmptyState.
 */
export function EmptyState(props) {
  return <UiEmptyState {...props} />;
}

export default EmptyState;
