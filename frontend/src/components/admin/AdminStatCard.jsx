import React from 'react';
import { StatCard } from '../ui/StatCard.jsx';

/**
 * AdminStatCard — Compatibility wrapper delegating to authoritative StatCard.
 * Preserves title, subtitle, icon, loading, error, and safe NaN prevention.
 */
export function AdminStatCard(props) {
  return <StatCard variant="standard" {...props} />;
}

export default AdminStatCard;
