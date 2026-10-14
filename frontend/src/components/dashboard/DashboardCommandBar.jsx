import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import {
  FireIcon,
  ArrowRightIcon,
  ClockIcon,
  AptitudeIcon,
  MockTestIcon,
  SparklesIcon,
} from "../ui/Icons.jsx";

/**
 * Format timestamp into concise relative time
 */
function formatRelativeTime(ts) {
  if (!ts) return "";
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
}

/**
 * DashboardCommandBar — Unified, high-density apex command bar.
 * Apple + Linear design pattern:
 * - Combines candidate greeting, credentials, and streak telemetry with the singular next action.
 * - Replaces separate stacked apex bar + large next action card.
 * - Handles:
 *   1. Active in-progress assessment resume CTA
 *   2. Tailored next-step recommendation CTA
 *   3. Informative getting-started state for brand-new users (no misleading claims)
 *   4. Daily practice continuity state
 */
export function DashboardCommandBar({
  user = {},
  readiness = null,
  streakDays = 0,
  continueActivity = null,
  recommendation = null,
}) {
  const firstName = user?.firstName?.trim() || "Student";
  const academicDetails = [
    user?.branch,
    user?.college,
    user?.graduationYear ? `'${String(user.graduationYear).slice(-2)}` : null,
  ]
    .filter(Boolean)
    .join(" • ");

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const hasReadiness =
    readiness?.score !== null &&
    readiness?.score !== undefined &&
    readiness?.status !== "insufficient_data";

  // Case 1: In-progress assessment
  const hasActiveAssessment =
    continueActivity &&
    (continueActivity.type === "mock_test" || continueActivity.type === "aptitude");

  // Resolve action content
  let actionBadge = null;
  let actionTitle = "";
  let actionSubtitle = "";
  let actionLink = "/aptitude";
  let actionBtnText = "Start Practice";
  let isPriorityAction = false;

  if (hasActiveAssessment) {
    const isMock = continueActivity.type === "mock_test";
    actionBadge = {
      text: "Active Assessment",
      classes: "text-primary bg-primary-tint border-primary-border",
    };
    actionTitle = continueActivity.title || (isMock ? "Mock Test Attempt" : "Aptitude Session");
    actionSubtitle = [
      continueActivity.subtitle,
      continueActivity.progress,
      continueActivity.startedAt ? `Started ${formatRelativeTime(continueActivity.startedAt)}` : null,
    ]
      .filter(Boolean)
      .join(" • ");
    actionLink = continueActivity.actionLink || (isMock ? "/mock-tests" : "/aptitude");
    actionBtnText = continueActivity.actionText || "Resume Test";
    isPriorityAction = true;
  } else if (recommendation && hasReadiness) {
    const getBadgeStyle = (priority) => {
      switch (priority) {
        case 1:
          return { text: "High Priority", classes: "text-amber-800 bg-amber-50 border-amber-200" };
        case 2:
          return { text: "Skill Target", classes: "text-blue-800 bg-blue-50 border-blue-200" };
        case 3:
          return { text: "Company Track", classes: "text-emerald-800 bg-emerald-50 border-emerald-200" };
        default:
          return { text: "Next Step", classes: "text-primary bg-primary-tint border-primary-border" };
      }
    };
    actionBadge = getBadgeStyle(recommendation.priority);
    actionTitle = recommendation.title;
    actionSubtitle = recommendation.description;
    actionLink = recommendation.actionLink || "/aptitude";
    actionBtnText = recommendation.actionText || "Continue Practice";
  } else if (!hasReadiness) {
    // New User Getting Started State
    actionBadge = {
      text: "Getting Started",
      classes: "text-blue-800 bg-blue-50 border-blue-200",
    };
    actionTitle = "Benchmark Your Placement Readiness";
    actionSubtitle =
      "Take your first diagnostic aptitude session to establish your baseline index and unlock tailored practice recommendations.";
    actionLink = "/aptitude";
    actionBtnText = "Start Diagnostic Test";
  } else {
    // Default Daily Continuity
    actionBadge = {
      text: "Daily Practice",
      classes: "text-slate-600 bg-slate-100 border-slate-200",
    };
    actionTitle = "Maintain Preparation Consistency";
    actionSubtitle =
      "Solve algorithmic problems or practice topic-wise quantitative and logical questions today.";
    actionLink = "/aptitude";
    actionBtnText = "Start Practice";
  }

  return (
    <section
      aria-label="Student command bar and next action"
      className={`bg-white border rounded-xl p-3.5 sm:p-4 shadow-xs transition-all ${
        isPriorityAction ? "border-primary/40 ring-1 ring-primary/20" : "border-slate-200/90"
      }`}
    >
      {/* Top Bar: Identity, Academic Badge & Streak */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pb-2.5 border-b border-slate-100">
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

        {/* Right Telemetry: Streak Pill */}
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
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
        </div>
      </div>

      {/* Bottom Command Strip: Singular Next Action */}
      <div className="pt-2.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5 sm:gap-3.5">
        <div className="space-y-1 min-w-0 max-w-2xl">
          <div className="flex items-center gap-2 flex-wrap">
            {actionBadge && (
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${actionBadge.classes}`}
              >
                {actionBadge.text}
              </span>
            )}
            {hasActiveAssessment && continueActivity?.startedAt && (
              <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                <ClockIcon className="w-3 h-3" />
                {formatRelativeTime(continueActivity.startedAt)}
              </span>
            )}
          </div>

          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
            {actionTitle}
          </h2>

          <p className="text-xs text-slate-600 line-clamp-1 leading-relaxed">
            {actionSubtitle}
          </p>
        </div>

        <div className="shrink-0 self-start md:self-center">
          <Button
            to={actionLink}
            variant="primary"
            size="sm"
            iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
          >
            {actionBtnText}
          </Button>
        </div>
      </div>
    </section>
  );
}

export default DashboardCommandBar;
