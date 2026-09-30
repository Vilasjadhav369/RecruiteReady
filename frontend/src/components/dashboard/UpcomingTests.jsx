import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./DashboardIcons.jsx";

/**
 * UpcomingTests — Scheduled tests card with truthful empty state.
 */
function UpcomingTests({ tests = [] }) {
  const hasTests = Array.isArray(tests) && tests.length > 0;

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#172B4D]">Upcoming Tests</h2>
        </div>

        {hasTests ? (
          <div className="space-y-3">
            {tests.map((test, idx) => (
              <div key={idx} className="p-3 bg-[#F8FAFC] border border-[#D9E2EC] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#172B4D] block">{test.title}</span>
                  <span className="text-[11px] text-[#52606D] block">{test.scheduledAt}</span>
                </div>
                <Link
                  to="/mock-tests"
                  className="text-xs font-semibold text-[#2563EB] bg-[#E8F1FF] px-2.5 py-1 rounded-md no-underline"
                >
                  Enter
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#D9E2EC] mx-auto flex items-center justify-center text-[#9FB3C8] mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[#172B4D] mb-1">No upcoming tests</h3>
            <p className="text-xs text-[#52606D] max-w-xs mx-auto leading-relaxed">
              Mock tests and campus recruitment assessment slots will appear here when they are scheduled.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-[#D9E2EC]">
        <Link
          to="/mock-tests"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline"
        >
          <span>Explore Mock Tests</span>
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default UpcomingTests;
