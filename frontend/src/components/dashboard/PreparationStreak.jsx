import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card.jsx";
import { FireIcon, ArrowRightIcon } from "../ui/Icons.jsx";
import { Badge } from "../ui/Badge.jsx";

/**
 * PreparationStreak — Displays real practice streak, strictly avoiding fake counts.
 */
function PreparationStreak({ streakDays = 0 }) {
  const hasStreak = streakDays > 0;

  return (
    <Card className="p-5 sm:p-6 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                hasStreak
                  ? "bg-amber-50 text-amber-600 border border-amber-200"
                  : "bg-slate-100 text-slate-400"
              }`}
            >
              <FireIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 block">
                Preparation Streak
              </span>
              <span className="text-sm font-semibold text-slate-900 block">
                {hasStreak ? `${streakDays} Days in a row` : "Consistency Tracker"}
              </span>
            </div>
          </div>

          <Badge variant={hasStreak ? "warning" : "default"} size="sm">
            {hasStreak ? "Active Streak" : "0 Days"}
          </Badge>
        </div>

        <div className="mt-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-900 font-mono">
              {streakDays}
            </span>
            <span className="text-xs text-slate-500">consecutive days</span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed mt-2">
            {hasStreak
              ? "Great momentum. Keep practicing daily to retain algorithmic patterns and analytical agility."
              : "Solve a problem or attempt aptitude questions today to begin your consistency streak."}
          </p>
        </div>
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
        <Link
          to="/coding"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline"
        >
          <span>{hasStreak ? "Keep Streak Going" : "Solve a Problem Today"}</span>
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  );
}

export default PreparationStreak;
