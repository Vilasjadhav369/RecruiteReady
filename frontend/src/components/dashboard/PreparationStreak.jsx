import { FireIcon } from "./DashboardIcons.jsx";

/**
 * PreparationStreak — Displays real practice streak, never fabricating fake day counts.
 */
function PreparationStreak({ streakDays = 0 }) {
  const hasStreak = streakDays > 0;

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-xs flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${hasStreak ? "bg-amber-50 text-amber-600 border border-amber-200" : "bg-[#F8FAFC] text-[#9FB3C8] border border-[#D9E2EC]"}`}>
          <FireIcon className="w-6 h-6" />
        </div>
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-[#52606D] block">
            Preparation Streak
          </span>
          <span className="text-base font-bold text-[#172B4D] block mt-0.5">
            {hasStreak ? `${streakDays} Days In A Row` : "Start Your Streak"}
          </span>
          <p className="text-xs text-[#52606D] mt-0.5">
            {hasStreak
              ? "Great momentum. Keep practicing daily to retain concepts."
              : "Start your first practice session to begin building your consistency streak."}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PreparationStreak;
