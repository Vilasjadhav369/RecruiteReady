import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../ui/Button.jsx";
import {
  FireIcon,
  ArrowRightIcon,
  ClockIcon,
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
 * Capitalize college name or acronym safely (e.g. pict -> PICT, iitb -> IITB).
 */
function formatCollegeName(college) {
  if (!college || typeof college !== "string") return "";
  const trimmed = college.trim();
  if (trimmed.length <= 5) return trimmed.toUpperCase();
  return trimmed
    .split(/\s+/)
    .map((word) =>
      word.length <= 5 && !word.includes(".")
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
}

/**
 * DashboardCommandBar — Compact, ~130px Hero Card.
 * Left: Greeting + One meta line (capitalized acronyms).
 * Right: Streak chip (neutral at 0 days) + Primary button.
 * Next Action / Skill target: Single line inside the card.
 */
export function DashboardCommandBar({
  user = {},
  readiness = null,
  streakDays = 0,
  continueActivity = null,
  recommendation = null,
}) {
  const rawFirstName = user?.firstName?.trim() || "Student";
  const firstName = rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1);
  const collegeFormatted = formatCollegeName(user?.college);
  const gradYear = user?.graduationYear ? `'${String(user.graduationYear).slice(-2)}` : null;

  const academicDetails = [user?.branch, collegeFormatted, gradYear]
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
  let actionBadgeText = "Daily Practice";
  let actionTitle = "Maintain Preparation Consistency";
  let actionSubtitle = "Solve practice problems or take a timed assessment.";
  let actionLink = "/aptitude";
  let actionBtnText = "Start Practice";

  if (hasActiveAssessment) {
    const isMock = continueActivity.type === "mock_test";
    actionBadgeText = "In Progress";
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
  } else if (recommendation && hasReadiness) {
    actionBadgeText = recommendation.priority === 1 ? "Priority" : "Next Step";
    actionTitle = recommendation.title;
    actionSubtitle = recommendation.description;
    actionLink = recommendation.actionLink || "/aptitude";
    actionBtnText = recommendation.actionText || "Continue Practice";
  } else if (!hasReadiness) {
    actionBadgeText = "Diagnostic";
    actionTitle = "Benchmark Your Placement Readiness";
    actionSubtitle = "Take your diagnostic aptitude session to calculate your baseline index.";
    actionLink = "/aptitude";
    actionBtnText = "Start Diagnostic Test";
  }

  const isZeroStreak = streakDays === 0;

  return (
    <section
      aria-label="Student command bar and next action"
      className="bg-card border border-border rounded-xl p-3 sm:p-4 shadow-xs space-y-3"
    >
      {/* Top Row: Greeting + Meta line on Left; Streak Chip on Right */}
      <div className="flex items-center justify-between gap-3 min-w-0">
        <div className="min-w-0 flex-1">
          <h1 className="text-lg sm:text-xl font-bold font-heading text-ink tracking-tight leading-tight m-0 truncate">
            {timeGreeting}, {firstName}
          </h1>
          {academicDetails ? (
            <p className="text-xs text-ink-2 font-medium truncate mt-0.5 leading-normal m-0">
              {academicDetails}
            </p>
          ) : (
            <p className="text-xs text-ink-2 font-medium truncate mt-0.5 leading-normal m-0">
              Placement Preparation Workspace
            </p>
          )}
        </div>

        {/* Streak Chip (Neutral outline at 0 days, warning token when active) */}
        <div className="shrink-0 flex items-center">
          <Link
            to="/progress"
            aria-label={`Current streak: ${streakDays} ${streakDays === 1 ? "day" : "days"}`}
            title="Current streak"
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors no-underline font-medium ${
              isZeroStreak
                ? "border border-border bg-card text-ink-2 hover:bg-primary-soft hover:text-ink"
                : "border border-warning/30 bg-warning/10 text-ink hover:bg-warning/20 font-semibold"
            }`}
          >
            <FireIcon className={`w-3.5 h-3.5 shrink-0 ${isZeroStreak ? "text-ink-2" : "text-warning"}`} />
            <span className="font-mono text-xs font-semibold">
              {isZeroStreak ? "0 days" : `${streakDays} ${streakDays === 1 ? "day" : "days"}`}
            </span>
          </Link>
        </div>
      </div>

      {/* Bottom Row: Next Action / Skill Target Strip */}
      <div className="pt-2.5 border-t border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary-soft text-ink-2 shrink-0">
            {actionBadgeText}
          </span>
          <div className="min-w-0 flex items-baseline gap-2">
            <span className="text-xs sm:text-sm font-semibold text-ink truncate block">
              {actionTitle}
            </span>
            {actionSubtitle && (
              <span className="hidden md:inline text-[11px] text-ink-2 truncate">
                — {actionSubtitle}
              </span>
            )}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {hasActiveAssessment && (
            <span className="text-[11px] text-ink-2 flex items-center gap-1 font-mono">
              <ClockIcon className="w-3 h-3" /> In progress
            </span>
          )}
          <Button
            to={actionLink}
            variant="primary"
            size="sm"
            className="w-full sm:w-auto text-xs py-1.5 px-3 whitespace-nowrap"
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
