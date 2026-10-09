import EmptyState from "./EmptyState.jsx";
import LoadingSkeleton from "./LoadingSkeleton.jsx";

/**
 * LiveStatistics — Displays real-time platform metrics.
 * Architecture ready for GET /api/analytics/live.
 *
 * Data states: loading | success | empty | error
 * Currently shows empty state — backend business APIs are Phase 3+.
 *
 * @param {Object|null} data - Live stats from API
 * @param {boolean} loading
 * @param {boolean} hasError
 */
function LiveStatistics({ data = null, loading = false, hasError = false }) {
  const METRIC_DEFS = [
    {
      key: "activeStudents",
      label: "Active Students",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <circle cx="8" cy="7" r="3" stroke="#2563EB" strokeWidth="1.5"/>
          <path d="M2 17c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="15" cy="7" r="2" stroke="#2563EB" strokeWidth="1.25"/>
          <path d="M18 17c0-2.209-1.343-4-3-4" stroke="#2563EB" strokeWidth="1.25" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      key: "questionsAttempted",
      label: "Questions Attempted",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="14" height="14" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
          <path d="M7 10H13M7 13H11" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M7 7H13" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      key: "codeSubmissions",
      label: "Code Submissions",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M6.5 7.5L3 10l3.5 2.5M13.5 7.5L17 10l-3.5 2.5M11 6L9 14" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      key: "mockTestsTaken",
      label: "Mock Tests Taken",
      icon: (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <rect x="3" y="5" width="14" height="10" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
          <path d="M7 9h6M7 12h4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {METRIC_DEFS.map((m) => (
          <div key={m.key} className="bg-white border border-[#D9E2EC] rounded-xl p-6 space-y-3">
            <LoadingSkeleton className="h-10 w-10 rounded-lg" />
            <LoadingSkeleton className="h-7 w-20" />
            <LoadingSkeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-xl py-12 flex items-center justify-center">
        <div className="text-center">
          <span className="text-[#52606D] text-sm block mb-2">Unable to load platform statistics.</span>
          <span className="text-xs text-[#9FB3C8] block">Please check back shortly.</span>
        </div>
      </div>
    );
  }

  // No data yet (backend not connected)
  if (!data) {
    return (
      <div className="bg-white border border-dashed border-[#D9E2EC] rounded-xl py-12">
        <EmptyState
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M3 14l4-4 3 3 4-5 3 3" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
            </svg>
          }
          title="Live platform statistics"
          description="Live student activity statistics will update dynamically as students practice."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {METRIC_DEFS.map((metric) => (
        <div key={metric.key} className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="w-10 h-10 bg-primary-tint rounded-lg flex items-center justify-center mb-4">
            {metric.icon}
          </div>
          <p className="text-2xl font-bold text-[#172B4D] mb-1">
            {data[metric.key] != null ? data[metric.key].toLocaleString() : "—"}
          </p>
          <p className="text-sm text-[#52606D]">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}

export default LiveStatistics;

