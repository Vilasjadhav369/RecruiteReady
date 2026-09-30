import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./DashboardIcons.jsx";

/**
 * TargetCompanies — Renders user's selected target companies or helpful empty state.
 */
function TargetCompanies({ companies = [] }) {
  const hasCompanies = Array.isArray(companies) && companies.length > 0;

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-[#172B4D]">Target Companies</h2>
          <p className="text-xs text-[#52606D] mt-0.5">Companies you are actively preparing for</p>
        </div>
        <Link
          to="/profile"
          className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline"
        >
          {hasCompanies ? "Edit Targets" : "Choose Companies"}
        </Link>
      </div>

      {hasCompanies ? (
        <div className="flex flex-wrap gap-2.5 pt-1">
          {companies.map((company, idx) => (
            <div
              key={idx}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#D9E2EC] text-xs font-semibold text-[#172B4D]"
            >
              <div className="w-5 h-5 rounded bg-[#E8F1FF] text-[#2563EB] flex items-center justify-center text-[10px] font-bold">
                {company[0]?.toUpperCase() ?? "C"}
              </div>
              <span>{company}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-6 text-center border border-dashed border-[#D9E2EC] rounded-xl bg-[#F8FAFC]/50 mt-2">
          <p className="text-xs text-[#52606D] mb-3">
            No target companies selected yet. Select the companies you want to crack to tailor your preparation.
          </p>
          <Link
            to="/profile"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-4 py-2 rounded-lg transition-colors no-underline"
          >
            <span>Set Target Companies</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default TargetCompanies;
