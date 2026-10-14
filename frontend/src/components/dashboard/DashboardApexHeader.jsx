import React from "react";
import { Link } from "react-router-dom";
import { FireIcon, ArrowRightIcon } from "../ui/Icons.jsx";

/**
 * DashboardApexHeader — Compact, premium apex bar for authenticated students.
 * Apple + Linear aesthetic: High information density, subtle borders, zero oversized hero bloat.
 * 
 * Displays:
 * - Time-of-day greeting + Student name + Academic credential tag
 * - Quick Placement Readiness metric / 100 with status indicator
 * - Consistency Streak badge (real consecutive practice days)
 * - Quick action links (Progress & Profile)
 */
export function DashboardApexHeader({
  user = {},
  readiness = null,
  streakDays = 0,
}) {
  const firstName = user?.firstName?.trim() || "Student";
  const academicDetails = [user?.branch, user?.college, user?.graduationYear ? `'${String(user.graduationYear).slice(-2)}` : null]
    .filter(Boolean)
    .join(" • ");

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const readinessScore = readiness?.score ?? null;
  const hasReadiness = readinessScore !== null && readiness?.status !== "insufficient_data";

  return (
    <section 
      aria-label="Student overview header" 
      className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left: Identity, Academic Badge & Greeting */}
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
            <span className="font-semibold uppercase tracking-wider text-primary bg-primary-tint px-2 py-0.5 rounded border border-primary-border">
              Student Workspace
            </span>
            {user?.preparationLevel && (
              <span className="font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 capitalize">
                {user.preparationLevel}
              </span>
            )}
            {academicDetails && (
              <span className="text-slate-500 font-medium truncate max-w-xs sm:max-w-md hidden sm:inline">
                {academicDetails}
              </span>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {timeGreeting}, {firstName}
          </h1>
        </div>

        {/* Right: Key Telemetry Pills (Streak & Readiness) */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap shrink-0">
          {/* Practice Streak Pill */}
          <Link
            to="/progress"
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50/70 border border-amber-200/80 text-amber-900 hover:bg-amber-100/70 transition-colors group no-underline"
            title={`${streakDays} consecutive practice days`}
          >
            <FireIcon className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-left leading-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 block">
                Streak
              </span>
              <span className="text-xs font-bold font-mono text-amber-900 mt-0.5 block">
                {streakDays} {streakDays === 1 ? "day" : "days"}
              </span>
            </div>
          </Link>

          {/* Placement Readiness Pill */}
          <Link
            to="/progress"
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200/90 text-slate-800 hover:border-slate-300 hover:bg-slate-100 transition-colors group no-underline"
            title={hasReadiness ? `Placement Readiness: ${readinessScore}/100` : "Readiness: Pending activity data"}
          >
            <div className="text-left leading-none">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                Readiness
              </span>
              <span className="text-xs font-bold font-mono text-slate-900 mt-0.5 block">
                {hasReadiness ? (
                  <>
                    <span>{readinessScore}</span>
                    <span className="text-slate-400 font-normal text-[11px]">/100</span>
                  </>
                ) : (
                  <span className="text-slate-500 font-sans font-normal text-[11px]">Pending</span>
                )}
              </span>
            </div>
            <ArrowRightIcon className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 group-hover:translate-x-0.5 transition-all" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default DashboardApexHeader;
