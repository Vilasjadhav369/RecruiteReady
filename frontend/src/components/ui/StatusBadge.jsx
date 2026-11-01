import React from 'react';
import { Badge } from './Badge.jsx';

/**
 * StatusBadge — Maps system statuses to semantic badge styles.
 * Supported: Active, Inactive, Published, Draft, Pending, Approved, Rejected, Completed, In Progress, Upcoming.
 */
export function StatusBadge({ status = '', className = '', ...props }) {
  const normalized = String(status).toLowerCase().trim().replace(/[-_]/g, ' ');

  const statusConfig = {
    active: { variant: 'success', label: 'Active', dot: true },
    inactive: { variant: 'default', label: 'Inactive', dot: false },
    published: { variant: 'success', label: 'Published', dot: true },
    draft: { variant: 'warning', label: 'Draft', dot: false },
    pending: { variant: 'warning', label: 'Pending', dot: true },
    approved: { variant: 'success', label: 'Approved', dot: true },
    rejected: { variant: 'danger', label: 'Rejected', dot: false },
    completed: { variant: 'brand', label: 'Completed', dot: true },
    'in progress': { variant: 'info', label: 'In Progress', dot: true },
    upcoming: { variant: 'default', label: 'Upcoming', dot: false },
    submitted: { variant: 'brand', label: 'Submitted', dot: true },
    expired: { variant: 'danger', label: 'Expired', dot: false },
    passed: { variant: 'success', label: 'Passed', dot: true },
    failed: { variant: 'danger', label: 'Failed', dot: false },
    accepted: { variant: 'success', label: 'Accepted', dot: true },
    'wrong answer': { variant: 'danger', label: 'Wrong Answer', dot: false },
    'time limit exceeded': { variant: 'warning', label: 'Time Limit Exceeded', dot: false },
    'compilation error': { variant: 'danger', label: 'Compilation Error', dot: false },
    'runtime error': { variant: 'danger', label: 'Runtime Error', dot: false },
    'execution unavailable': { variant: 'default', label: 'Not evaluated', dot: false },
    'execution_unavailable': { variant: 'default', label: 'Not evaluated', dot: false },
  };

  const config = statusConfig[normalized] || {
    variant: 'default',
    label: status || 'Unknown',
    dot: false,
  };

  return (
    <Badge
      variant={config.variant}
      dot={config.dot}
      size="sm"
      className={className}
      {...props}
    >
      {config.label}
    </Badge>
  );
}

export default StatusBadge;
