import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./DashboardIcons.jsx";

/**
 * WelcomeBanner — Top dashboard greeting with primary actions.
 * Uses real authenticated student first name.
 */
function WelcomeBanner({ firstName = "Student" }) {
  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="max-w-xl">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#E8F1FF] text-[#2563EB] mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
            Placement Preparation Dashboard
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D] tracking-tight">
            Good to see you, {firstName}.
          </h1>
          <p className="text-sm text-[#52606D] mt-1.5 leading-relaxed">
            Keep building your preparation one step at a time. Practice questions, solve coding problems, and track your progress.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-shrink-0">
          <Link
            to="/aptitude"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-5 py-2.5 rounded-lg transition-colors no-underline shadow-xs cursor-pointer"
          >
            <span>Start Practicing</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
          <Link
            to="/progress"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#172B4D] bg-[#F8FAFC] hover:bg-white border border-[#D9E2EC] hover:border-[#9FB3C8] px-5 py-2.5 rounded-lg transition-colors no-underline cursor-pointer"
          >
            <span>View Progress</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;
