import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./DashboardIcons.jsx";

/**
 * PreparationMetricCard — Displays category preparation progress with truthful zero/empty states.
 */
function PreparationMetricCard({ title, icon: Icon, attempted = 0, completed = 0, unit = "questions", to, emptyMessage = "No activity yet" }) {
  const hasActivity = attempted > 0 || completed > 0;

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#2563EB]/40 transition-colors">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-[#E8F1FF] flex items-center justify-center text-[#2563EB]">
            <Icon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-semibold text-[#52606D] bg-[#F8FAFC] border border-[#D9E2EC] px-2 py-0.5 rounded-full">
            {hasActivity ? `${attempted} Attempted` : "Not Started"}
          </span>
        </div>

        <h3 className="text-base font-bold text-[#172B4D] mb-1">{title}</h3>

        {hasActivity ? (
          <div className="mt-2">
            <span className="text-2xl font-bold text-[#172B4D]">{completed}</span>
            <span className="text-xs text-[#52606D] ml-1.5">{unit} completed</span>
          </div>
        ) : (
          <p className="text-xs text-[#52606D] mt-2 leading-relaxed">
            {emptyMessage}
          </p>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-[#D9E2EC]">
        <Link
          to={to}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline"
        >
          <span>{hasActivity ? "Continue Practice" : "Start Practicing"}</span>
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default PreparationMetricCard;
