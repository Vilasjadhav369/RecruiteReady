import React from 'react';

/**
 * RecruitReady Unified Icon System
 * Standardized SVG stroke icons (20x20 viewBox, 1.75px stroke width, rounded caps/joins).
 * Functional, crisp, no emojis.
 */

const defaultProps = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: '1.75',
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

export function DashboardIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="3" y="3" width="6" height="6" rx="1.5" />
      <rect x="11" y="3" width="6" height="6" rx="1.5" />
      <rect x="3" y="11" width="6" height="6" rx="1.5" />
      <rect x="11" y="11" width="6" height="6" rx="1.5" />
    </svg>
  );
}

export function AptitudeIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="10" cy="10" r="7" />
      <path d="M10 6v4l2.5 2.5" />
    </svg>
  );
}

export function CodingIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polyline points="6 7 3 10 6 13" />
      <polyline points="14 7 17 10 14 13" />
      <line x1="11.5" y1="5" x2="8.5" y2="15" />
    </svg>
  );
}

export function MockTestIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M7 3H5a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2h-2" />
      <rect x="7" y="2" width="6" height="3" rx="1" />
      <path d="M7 10l2 2 4-4" />
    </svg>
  );
}

export function CompanyIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="3" y="6" width="14" height="11" rx="2" />
      <path d="M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2" />
      <line x1="3" y1="11" x2="17" y2="11" />
    </svg>
  );
}

export function ResourcesIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M4 4h12v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
      <line x1="7" y1="8" x2="13" y2="8" />
      <line x1="7" y1="11" x2="11" y2="11" />
    </svg>
  );
}

export function ProgressIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <line x1="15" y1="17" x2="15" y2="9" />
      <line x1="10" y1="17" x2="10" y2="5" />
      <line x1="5" y1="17" x2="5" y2="13" />
    </svg>
  );
}

export function ProfileIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M16 17v-1.5a3.5 3.5 0 00-3.5-3.5h-5A3.5 3.5 0 004 15.5V17" />
      <circle cx="10" cy="7" r="3.5" />
    </svg>
  );
}

export function SearchIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="9" cy="9" r="6" />
      <line x1="13.5" y1="13.5" x2="17" y2="17" />
    </svg>
  );
}

export function CheckIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polyline points="4 10 8 14 16 6" />
    </svg>
  );
}

export function CloseIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <line x1="15" y1="5" x2="5" y2="15" />
      <line x1="5" y1="5" x2="15" y2="15" />
    </svg>
  );
}

export function PlusIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <line x1="10" y1="4" x2="10" y2="16" />
      <line x1="4" y1="10" x2="16" y2="10" />
    </svg>
  );
}

export function ChevronDownIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polyline points="6 8 10 12 14 8" />
    </svg>
  );
}

export function ChevronUpIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polyline points="14 12 10 8 6 12" />
    </svg>
  );
}

export function ChevronRightIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polyline points="8 6 12 10 8 14" />
    </svg>
  );
}

export function ChevronLeftIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polyline points="12 14 8 10 12 6" />
    </svg>
  );
}

export function ArrowRightIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="3" y1="8" x2="13" y2="8" />
      <polyline points="9 4 13 8 9 12" />
    </svg>
  );
}

export function ArrowLeftIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="13" y1="8" x2="3" y2="8" />
      <polyline points="7 12 3 8 7 4" />
    </svg>
  );
}

export function InfoIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="10" cy="10" r="7" />
      <line x1="10" y1="9" x2="10" y2="14" />
      <circle cx="10" cy="6.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function AlertCircleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="10" cy="10" r="7" />
      <line x1="10" y1="6" x2="10" y2="11" />
      <circle cx="10" cy="14" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function AlertTriangleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M10 3L2 17h16L10 3z" />
      <line x1="10" y1="8" x2="10" y2="12" />
      <circle cx="10" cy="15" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function CheckCircleIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="10" cy="10" r="7" />
      <polyline points="7 10 9 12 13 8" />
    </svg>
  );
}

export function RefreshIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M16 10a6 6 0 11-1.8-4.2L16 4" />
      <polyline points="16 8 16 4 12 4" />
    </svg>
  );
}

export function FilterIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polygon points="3 4 17 4 11 11 11 16 9 17 9 11 3 4" />
    </svg>
  );
}

export function EditIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M13.5 3.5l3 3L6 17H3v-3L13.5 3.5z" />
    </svg>
  );
}

export function TrashIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <polyline points="3 5 17 5" />
      <path d="M6 5V3a1 1 0 011-1h6a1 1 0 011 1v2" />
      <path d="M5 5l1 12a1 1 0 001 1h6a1 1 0 001-1l1-12" />
      <line x1="8.5" y1="8.5" x2="8.5" y2="14.5" />
      <line x1="11.5" y1="8.5" x2="11.5" y2="14.5" />
    </svg>
  );
}

export function EyeIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M2 10s3-5 8-5 8 5 8 5-3 5-8 5-8-5-8-5z" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

export function EyeOffIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M3 3l14 14" />
      <path d="M9.5 5.5A7.5 7.5 0 0118 10s-1.5 2.5-4 4" />
      <path d="M6 6A8.5 8.5 0 002 10s3 5 8 5a8 8 0 004-1" />
      <path d="M8.5 8.5a2.5 2.5 0 003 3" />
    </svg>
  );
}

export function ExternalLinkIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M14 10.5V15a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1h4.5" />
      <polyline points="11 3 16 3 16 8" />
      <line x1="8.5" y1="10.5" x2="15.5" y2="3.5" />
    </svg>
  );
}

export function CopyIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="7" y="7" width="9" height="9" rx="1.5" />
      <path d="M4 12H3a1 1 0 01-1-1V4a1 1 0 011-1h7a1 1 0 011 1v1" />
    </svg>
  );
}

export function TrophyIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M5 4h10v5a5 5 0 01-10 0V4z" />
      <path d="M5 6H3a2 2 0 00-2 2v1a2 2 0 002 2h2" />
      <path d="M15 6h2a2 2 0 012 2v1a2 2 0 01-2 2h-2" />
      <line x1="10" y1="14" x2="10" y2="17" />
      <line x1="7" y1="17" x2="13" y2="17" />
    </svg>
  );
}

export function StarIcon({ className = 'w-4 h-4', filled = false }) {
  return (
    <svg
      className={className}
      {...defaultProps}
      fill={filled ? 'currentColor' : 'none'}
    >
      <polygon points="10 2.5 12.3 7.2 17.5 8 13.8 11.6 14.6 16.8 10 14.4 5.4 16.8 6.2 11.6 2.5 8 7.7 7.2 10 2.5" />
    </svg>
  );
}

export function ClockIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <circle cx="10" cy="10" r="7" />
      <polyline points="10 6 10 10 13 12" />
    </svg>
  );
}

export function CalendarIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} {...defaultProps}>
      <rect x="3" y="4" width="14" height="13" rx="1.5" />
      <line x1="3" y1="8" x2="17" y2="8" />
      <line x1="7" y1="2" x2="7" y2="5" />
      <line x1="13" y1="2" x2="13" y2="5" />
    </svg>
  );
}

export function UsersIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M14 17v-1a3 3 0 00-3-3H7a3 3 0 00-3 3v1" />
      <circle cx="9" cy="7" r="3" />
      <path d="M17 14a2.5 2.5 0 00-2-2.4" />
      <path d="M13 4.6a2.5 2.5 0 010 4.8" />
    </svg>
  );
}

export function LogoutIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M8 4H4a1 1 0 00-1 1v10a1 1 0 001 1h4" />
      <polyline points="13 14 17 10 13 6" />
      <line x1="17" y1="10" x2="7" y2="10" />
    </svg>
  );
}

export function BellIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M15 13v-4a5 5 0 00-10 0v4l-1.5 2h13L15 13z" />
      <path d="M8.5 17a1.5 1.5 0 003 0" />
    </svg>
  );
}

export function FireIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={className} {...defaultProps}>
      <path d="M10 2c0 3-4 4.5-4 8.5a5 5 0 0010 0c0-4-3.5-5-3.5-8.5z" />
    </svg>
  );
}

export function MenuIcon({ className = 'w-6 h-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

export function SpinnerIcon({ className = 'w-5 h-5' }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
