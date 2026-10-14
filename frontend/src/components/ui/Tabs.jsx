import React from 'react';

/**
 * Tabs — Accessible tabbed navigation with pill or underline visual styles.
 */
export function Tabs({
  tabs = [],
  activeTab,
  onChange,
  variant = 'pill', // 'pill' | 'underline'
  className = '',
}) {
  return (
    <div
      role="tablist"
      className={`flex items-center gap-1 ${
        variant === 'pill'
          ? 'bg-slate-100/80 p-1 rounded-xl border border-slate-200/60 w-fit max-w-full overflow-x-auto'
          : 'border-b border-slate-200 w-full overflow-x-auto'
      } ${className}`}
    >
      {tabs.map((tab) => {
        const id = typeof tab === 'object' ? tab.id || tab.key || tab.value : tab;
        const label = typeof tab === 'object' ? tab.label || tab.title : tab;
        const count = typeof tab === 'object' ? tab.count : undefined;
        const icon = typeof tab === 'object' ? tab.icon : undefined;
        const isActive = activeTab === id;

        if (variant === 'underline') {
          return (
            <button
              key={id}
              role="tab"
              aria-selected={isActive}
              type="button"
              onClick={() => onChange && onChange(id)}
              className={`pb-3 px-3.5 text-xs sm:text-sm font-semibold transition-all border-b-2 flex items-center gap-1.5 shrink-0 cursor-pointer ${
                isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {icon && <span className="shrink-0">{icon}</span>}
              <span>{label}</span>
              {count !== undefined && (
                <span
                  className={`text-[11px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-primary-soft text-primary-dark' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        }

        // Pill variant
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            type="button"
            onClick={() => onChange && onChange(id)}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-150 flex items-center gap-1.5 shrink-0 cursor-pointer ${
              isActive
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {icon && <span className="shrink-0">{icon}</span>}
            <span>{label}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  isActive ? 'bg-slate-100 text-slate-800' : 'bg-slate-200/60 text-slate-600'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
