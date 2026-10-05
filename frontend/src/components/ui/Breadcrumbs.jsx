import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRightIcon } from './Icons.jsx';

/**
 * Breadcrumbs — Compact navigation trail with chevron separators.
 */
export function Breadcrumbs({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={`flex items-center gap-1.5 text-xs text-slate-500 ${className}`}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const label = typeof item === 'object' ? item.label : item;
        const to = typeof item === 'object' ? (item.to || item.href) : undefined;

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <ChevronRightIcon className="w-3 h-3 text-slate-400 shrink-0" />
            )}

            {isLast || !to ? (
              <span
                className={`truncate max-w-[200px] ${
                  isLast ? 'font-semibold text-slate-800' : 'text-slate-500'
                }`}
                aria-current={isLast ? 'page' : undefined}
              >
                {label}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-slate-900 transition-colors truncate max-w-[150px]"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumbs;
