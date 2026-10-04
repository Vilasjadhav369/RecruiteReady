import React from 'react';
import { StatCard } from './ui/StatCard.jsx';

/**
 * MetricCard — Compatibility wrapper delegating to authoritative StatCard ('compact' variant).
 */
export function MetricCard(props) {
  return <StatCard variant="compact" {...props} />;
}

export default MetricCard;
