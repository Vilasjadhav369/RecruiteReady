import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./DashboardIcons.jsx";

/**
 * RecentActivity — Activity feed with truthful empty state when no activity has occurred yet.
 */
function RecentActivity({ activities = [] }) {
  const hasActivity = Array.isArray(activities) && activities.length > 0;

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-xs flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[#172B4D]">Recent Activity</h2>
          {hasActivity && (
            <span className="text-xs text-[#2563EB] font-semibold cursor-pointer">
              View All
            </span>
          )}
        </div>

        {hasActivity ? (
          <div className="divide-y divide-[#D9E2EC]/70">
            {activities.map((item, idx) => (
              <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[#172B4D] block">{item.title}</span>
                  <span className="text-xs text-[#52606D] block">{item.timestamp}</span>
                </div>
                {item.score && (
                  <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                    {item.score}
                  </span>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#D9E2EC] mx-auto flex items-center justify-center text-[#9FB3C8] mb-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="9" />
                <polyline points="12 7 12 12 15 15" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-[#172B4D] mb-1">No activity yet</h3>
            <p className="text-xs text-[#52606D] max-w-xs mx-auto leading-relaxed">
              Your preparation activity will appear here as you practice questions and solve problems.
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-[#D9E2EC]">
        <Link
          to="/aptitude"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline"
        >
          <span>Start Practicing</span>
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default RecentActivity;
