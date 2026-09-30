import { Link } from "react-router-dom";
import ProgressBar from "../ProgressBar.jsx";
import { ArrowRightIcon } from "./DashboardIcons.jsx";

/**
 * ProfileCompletionCard — Calculates profile completeness dynamically from real user fields.
 * No fabricated percentages.
 */
function ProfileCompletionCard({ user }) {
  if (!user) return null;

  // 7 key fields evaluated
  const fields = [
    { label: "First Name", completed: Boolean(user.firstName?.trim()) },
    { label: "Last Name", completed: Boolean(user.lastName?.trim()) },
    { label: "Email", completed: Boolean(user.email?.trim()) },
    { label: "College", completed: Boolean(user.college?.trim()) },
    { label: "Branch", completed: Boolean(user.branch?.trim()) },
    { label: "Graduation Year", completed: Boolean(user.graduationYear) },
    { label: "Target Companies", completed: Array.isArray(user.targetCompanies) && user.targetCompanies.length > 0 },
  ];

  const completedCount = fields.filter((f) => f.completed).length;
  const totalCount = fields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = percentage === 100;

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">
            Profile Status
          </span>
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isComplete ? "bg-green-50 text-green-700" : "bg-[#E8F1FF] text-[#2563EB]"}`}>
            {isComplete ? "Complete" : `${completedCount}/${totalCount} Fields`}
          </span>
        </div>

        <div className="flex items-baseline justify-between mb-2">
          <h2 className="text-lg font-bold text-[#172B4D]">
            {isComplete ? "Profile Complete" : "Complete Your Profile"}
          </h2>
          <span className="text-xl font-bold text-[#172B4D]">{percentage}%</span>
        </div>

        <ProgressBar value={percentage} color={isComplete ? "bg-green-600" : "bg-[#2563EB]"} size="md" />

        <p className="text-xs text-[#52606D] mt-3 leading-relaxed">
          {isComplete
            ? "Your academic details and target companies are all set up."
            : "Add your college, department, and target companies to personalize your preparation journey."}
        </p>
      </div>

      <div className="mt-5 pt-4 border-t border-[#D9E2EC]">
        <Link
          to="/profile"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline"
        >
          <span>{isComplete ? "Manage Profile" : "Complete Profile"}</span>
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default ProfileCompletionCard;
