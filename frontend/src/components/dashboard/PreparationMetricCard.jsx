import React from 'react';
import { StatCard } from '../ui/StatCard.jsx';

/**
 * PreparationMetricCard — Compatibility wrapper delegating to authoritative StatCard ('domain' variant).
 */
export function PreparationMetricCard(props) {
  return <StatCard variant="domain" {...props} />;
}

export default PreparationMetricCard;
