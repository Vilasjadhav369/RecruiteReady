import React from 'react';
import { SpinnerIcon } from './Icons.jsx';

/**
 * Table — Professional, compact data table system.
 * Responsive horizontal overflow, hover states, subtle dividers.
 */
export function Table({
  className = '',
  containerClassName = '',
  loading = false,
  empty = false,
  emptyMessage = 'No records found.',
  columnsCount = 1,
  children,
  ...props
}) {
  return (
    <div className={`w-full overflow-hidden bg-white border border-slate-200 rounded-xl shadow-xs ${containerClassName}`}>
      <div className="overflow-x-auto lg:max-h-[calc(100vh-15rem)] lg:overflow-y-auto">
        <table className={`w-full text-left text-sm border-collapse ${className}`} {...props}>
          {children}
        </table>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center text-center text-slate-500 bg-white">
          <SpinnerIcon className="w-6 h-6 text-blue-600 mb-2" />
          <span className="text-xs font-medium">Loading data...</span>
        </div>
      )}

      {!loading && empty && (
        <div className="py-12 text-center text-slate-500 bg-white text-xs">
          {emptyMessage}
        </div>
      )}
    </div>
  );
}

export function TableHeader({ className = '', children, ...props }) {
  return (
    <thead className={`sticky top-0 z-10 bg-slate-50 border-b border-slate-200 ${className}`} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className = '', children, ...props }) {
  return (
    <tbody className={`divide-y divide-slate-100 ${className}`} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className = '', hoverable = true, children, ...props }) {
  const hoverClass = hoverable ? 'hover:bg-slate-50/60 transition-colors duration-100' : '';
  return (
    <tr className={`${hoverClass} ${className}`} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({
  className = '',
  align = 'left',
  children,
  ...props
}) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <th
      className={`py-2.5 px-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({
  className = '',
  align = 'left',
  children,
  ...props
}) {
  const alignClass =
    align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left';

  return (
    <td
      className={`py-2 px-3 text-xs sm:text-[13px] text-slate-700 align-middle ${alignClass} ${className}`}
      {...props}
    >
      {children}
    </td>
  );
}

export default Table;
