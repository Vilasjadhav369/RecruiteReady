import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from './Card.jsx';
import { ArrowRightIcon } from './Icons.jsx';

/**
 * Safe numeric extraction to guarantee NO NaN can ever render.
 * Accepts numbers, strings, or nested metric objects.
 */
function extractFormattedValue(val) {
  if (val === null || val === undefined) return '—';

  let raw = val;
  if (typeof val === 'object' && val !== null) {
    raw =
      val.total ??
      val.count ??
      val.questions ??
      val.problems ??
      val.active ??
      val.submissions ??
      val.attempts;
  }

  if (raw === null || raw === undefined) return '0';
  if (typeof raw === 'string' && isNaN(Number(raw))) return raw;

  const parsed = Number(raw);
  if (isNaN(parsed)) return '—';
  return parsed.toLocaleString();
}

function renderStatIcon(icon, fallbackClass = 'w-4 h-4 text-slate-700') {
  if (!icon) return null;
  if (React.isValidElement(icon)) return icon;
  if (typeof icon === 'function') {
    const IconComp = icon;
    return <IconComp className={fallbackClass} />;
  }
  return null;
}

/**
 * StatCard — Authoritative consolidated metric primitive for RecruitReady.
 * Variants:
 *  - 'standard' (default): High-fidelity card for student & admin dashboards
 *  - 'compact': Minimalist footprint (replaces MetricCard)
 *  - 'domain': Goal-oriented domain progress with actionable CTA (replaces PreparationMetricCard)
 */
export function StatCard({
  variant = 'standard',
  label,
  title,
  value,
  subtext,
  subtitle,
  change,
  positive = true,
  icon,
  loading = false,
  error = null,
  // Domain variant props
  attempted = 0,
  completed = 0,
  unit = 'questions',
  to = '/dashboard',
  emptyMessage = 'No activity yet',
  className = '',
  onClick,
  ...props
}) {
  const displayLabel = title || label || '';
  const displaySubtext = subtitle || subtext || '';

  // 1. Loading State
  if (loading) {
    return (
      <div
        className={`bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3 animate-pulse ${className}`}
        aria-hidden="true"
        {...props}
      >
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 bg-slate-100 rounded-lg" />
          <div className="w-16 h-3 bg-slate-100 rounded" />
        </div>
        <div className="w-20 h-7 bg-slate-100 rounded" />
        <div className="w-28 h-3 bg-slate-100 rounded" />
      </div>
    );
  }

  // 2. Error State
  if (error) {
    return (
      <div
        className={`bg-white border border-rose-200 rounded-xl p-5 shadow-xs ${className}`}
        role="alert"
        {...props}
      >
        <span className="text-xs font-semibold text-rose-700 block">{displayLabel || 'Metric'}</span>
        <span className="text-xs text-rose-500 mt-1 block">Data unavailable</span>
      </div>
    );
  }

  // 3. Compact Variant (MetricCard)
  if (variant === 'compact') {
    const formatted = extractFormattedValue(value);
    return (
      <div
        className={`bg-white border border-slate-200 rounded-lg p-2.5 sm:p-3 ${className}`}
        onClick={onClick}
        {...props}
      >
        <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500 block mb-1">
          {displayLabel}
        </span>
        <span className="text-xl font-bold text-slate-900 font-mono block mb-0.5">
          {formatted}
        </span>
        {change && (
          <span
            className={`text-[10px] font-medium block ${
              positive ? 'text-emerald-600' : 'text-amber-600'
            }`}
          >
            {change}
          </span>
        )}
      </div>
    );
  }

  // 4. Domain Variant (PreparationMetricCard)
  if (variant === 'domain') {
    const hasActivity = (attempted && attempted > 0) || (completed && completed > 0);
    return (
      <Card
        hoverable
        className={`p-4 sm:p-5 flex flex-col justify-between h-full group ${className}`}
        {...props}
      >
        <div>
          <div className="flex items-center justify-between mb-3.5">
            <div className="w-9 h-9 rounded-lg bg-primary-tint text-primary-dark flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-150">
              {renderStatIcon(icon, 'w-4 h-4')}
            </div>
            <span className="text-[11px] font-semibold text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded-full border border-slate-200/80">
              {hasActivity ? `${attempted} Attempted` : 'Not Started'}
            </span>
          </div>

          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-primary transition-colors">
            {displayLabel}
          </h3>

          {hasActivity ? (
            <div className="mt-2.5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                  {Number(completed || 0).toLocaleString()}
                </span>
                <span className="text-xs text-slate-500">
                  {Number(completed || 0) === 1 ? unit.replace(/s$/, '') : unit} completed
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">{emptyMessage}</p>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
          <Link
            to={to}
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-dark no-underline group-hover:underline"
          >
            <span>{hasActivity ? 'Continue Practice' : 'Start Practicing'}</span>
            <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </Card>
    );
  }

  // 5. Standard Variant (Default & AdminStatCard)
  const formattedValue = extractFormattedValue(value);

  return (
    <Card
      onClick={onClick}
      hoverable={!!onClick}
      className={`p-4 sm:p-5 flex flex-col justify-between ${className}`}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
          {displayLabel}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
            {renderStatIcon(icon, 'w-4 h-4 text-slate-700')}
          </div>
        )}
      </div>

      <div className="mt-3">
        <div className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight font-mono">
          {formattedValue}
        </div>

        <div className="mt-1 flex items-center gap-2 flex-wrap">
          {change && (
            <span
              className={`text-xs font-semibold ${
                positive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {change}
            </span>
          )}
          {displaySubtext && (
            <span className="text-xs text-slate-500 truncate max-w-full">
              {displaySubtext}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

export default StatCard;
