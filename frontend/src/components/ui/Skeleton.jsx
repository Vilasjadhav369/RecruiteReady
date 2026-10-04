import React from 'react';

/**
 * Skeleton — Pulse animation placeholders for loading UI states.
 */
export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-pulse bg-slate-200/80 rounded ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 ${className}`}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="pt-2 flex gap-2">
        <Skeleton className="h-8 w-20 rounded-lg" />
      </div>
    </div>
  );
}

export function SkeletonTableRow({ columns = 4, className = '' }) {
  return (
    <tr className={`border-b border-slate-100 ${className}`}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className="h-4 w-3/4" />
        </td>
      ))}
    </tr>
  );
}

export const LoadingSkeleton = Skeleton;

export default Skeleton;
