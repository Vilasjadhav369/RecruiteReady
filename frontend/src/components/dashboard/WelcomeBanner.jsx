import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon, ProgressIcon } from "../ui/Icons.jsx";
import { Button } from "../ui/Button.jsx";

/**
 * WelcomeBanner — Refined dashboard header greeting for authenticated students.
 * Conforms to Apple + Linear design direction with clear typography hierarchy and real academic details.
 */
function WelcomeBanner({ firstName = "Student", college = "", branch = "", graduationYear = null }) {
  const academicDetails = [branch, college, graduationYear ? `Batch of ${graduationYear}` : null]
    .filter(Boolean)
    .join(" • ");

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-6 sm:p-7 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="max-w-2xl space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" aria-hidden="true" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-[#166534] bg-[#DCFCE7] px-2.5 py-0.5 rounded-full border border-[#BBF7D0]">
              Student Dashboard
            </span>
            {academicDetails && (
              <span className="hidden sm:inline-block text-xs text-slate-500 font-medium truncate max-w-md">
                {academicDetails}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {firstName}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
            Track real assessment metrics, master algorithmic and analytical patterns, and prepare systematically for upcoming campus recruitment.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
          <Link to="/aptitude" className="no-underline">
            <Button
              variant="primary"
              size="md"
              iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
            >
              Start Practicing
            </Button>
          </Link>
          <Link to="/progress" className="no-underline">
            <Button
              variant="outline"
              size="md"
              iconLeft={<ProgressIcon className="w-4 h-4 text-slate-500" />}
            >
              View Progress
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default WelcomeBanner;

