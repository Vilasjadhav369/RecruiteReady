import { Link } from "react-router-dom";
import { ArrowRightIcon } from "./DashboardIcons.jsx";

/**
 * QuickActionCard — Interactive module quick-link card.
 */
function QuickActionCard({ title, description, icon: Icon, to }) {
  return (
    <Link
      to={to}
      className="group bg-white border border-[#D9E2EC] rounded-2xl p-5 shadow-xs hover:border-[#2563EB]/50 hover:shadow-sm transition-all no-underline flex flex-col justify-between"
    >
      <div>
        <div className="w-10 h-10 rounded-xl bg-[#F8FAFC] border border-[#D9E2EC] group-hover:bg-[#2563EB] group-hover:border-[#2563EB] text-[#2563EB] group-hover:text-white flex items-center justify-center transition-colors mb-4">
          <Icon className="w-5 h-5" />
        </div>
        <h3 className="text-sm font-bold text-[#172B4D] group-hover:text-[#2563EB] transition-colors mb-1">
          {title}
        </h3>
        <p className="text-xs text-[#52606D] leading-relaxed">
          {description}
        </p>
      </div>

      <div className="mt-4 pt-3 border-t border-[#D9E2EC]/70 flex items-center justify-between text-xs font-semibold text-[#2563EB]">
        <span>Open Module</span>
        <ArrowRightIcon className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </Link>
  );
}

export default QuickActionCard;
