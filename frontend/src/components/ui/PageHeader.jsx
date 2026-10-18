import React from 'react';
import { Breadcrumbs } from './Breadcrumbs.jsx';

/**
 * PageHeader — Consistent, restrained top header for all student and admin views.
 */
export function PageHeader({
  title,
  description,
  breadcrumbs,
  badge,
  actions,
  className = '',
}) {
  return (
    <div className={`space-y-1 pb-2 border-b border-slate-200/80 ${className}`}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs items={breadcrumbs} className="mb-0" />
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-lg sm:text-xl font-semibold text-slate-900 tracking-tight">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>
          {description && (
            <p title={typeof description === "string" ? description : undefined} className="text-xs sm:text-[13px] text-slate-500 max-w-3xl leading-normal sm:line-clamp-1">
              {description}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-2.5 self-start sm:self-auto shrink-0 flex-wrap">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default PageHeader;
