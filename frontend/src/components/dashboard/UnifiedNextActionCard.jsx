import React from "react";
import { Button } from "../ui/Button.jsx";
import {
  AptitudeIcon,
  MockTestIcon,
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
 * UnifiedNextActionCard — Singular focal action card.
 * Apple + Linear design pattern:
 * - Eliminates redundant stacked "Start Practicing" buttons.
 * - PRIORITY 1: If an in-progress assessment attempt exists, presents a prominent "Resume Assessment" banner.
 * - PRIORITY 2: If no active attempt exists, presents today's deterministic rule-based recommendation.
 */
export function UnifiedNextActionCard({
  continueActivity = null,
  recommendation = null,
}) {
  // Case 1: Active In-Progress Assessment to Resume
  if (continueActivity && (continueActivity.type === "mock_test" || continueActivity.type === "aptitude")) {
    const isMock = continueActivity.type === "mock_test";
    const IconComponent = isMock ? MockTestIcon : AptitudeIcon;
    const resumeUrl = continueActivity.actionLink || (isMock ? "/mock-tests" : "/aptitude");

    return (
      <section
        aria-label="In-progress assessment"
        className="bg-white border-2 border-primary/40 rounded-xl p-4 sm:p-5 shadow-xs relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-lg bg-primary-tint border border-primary-border flex items-center justify-center shrink-0 mt-0.5">
              <IconComponent className="w-5 h-5 text-primary" />
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-tint px-2 py-0.5 rounded border border-primary-border">
                  Active Assessment
                </span>
                {continueActivity.startedAt && (
                  <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    {formatRelativeTime(continueActivity.startedAt)}
                  </span>
                )}
              </div>

              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                {continueActivity.title}
              </h2>

              <p className="text-xs text-slate-600 line-clamp-1">
                {continueActivity.subtitle}
                {continueActivity.progress ? ` • ${continueActivity.progress}` : ""}
              </p>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Button
              to={resumeUrl}
              variant="primary"
              size="md"
              iconRight={<ArrowRightIcon className="w-4 h-4" />}
            >
              {continueActivity.actionText || "Resume Test"}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Case 2: Deterministic Next Step Recommendation
  if (recommendation) {
    const getBadgeStyle = (priority) => {
      switch (priority) {
        case 1:
          return { text: "High Priority", classes: "text-amber-800 bg-amber-50 border-amber-200" };
        case 2:
          return { text: "Skill Target", classes: "text-blue-800 bg-blue-50 border-blue-200" };
        case 3:
          return { text: "Company Track", classes: "text-emerald-800 bg-emerald-50 border-emerald-200" };
        default:
          return { text: "Daily Step", classes: "text-primary bg-primary-tint border-primary-border" };
      }
    };

    const badge = getBadgeStyle(recommendation.priority);

    return (
      <section
        aria-label="Recommended next action"
        className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1 max-w-2xl min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                Recommended Next Step
              </span>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.classes}`}>
                {badge.text}
              </span>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              {recommendation.title}
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {recommendation.description}
            </p>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Button
              to={recommendation.actionLink || "/aptitude"}
              variant="primary"
              size="md"
              iconRight={<ArrowRightIcon className="w-4 h-4" />}
            >
              {recommendation.actionText || "Get Started"}
            </Button>
          </div>
        </div>
      </section>
    );
  }

  // Fallback: Neutral default state
  return (
    <section
      aria-label="Preparation readiness status"
      className="bg-white border border-slate-200/90 rounded-xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4"
    >
      <div className="space-y-1">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
          Daily Placement Practice
        </span>
        <h2 className="text-base font-bold text-slate-900">
          Ready for today's practice session
        </h2>
        <p className="text-xs text-slate-600">
          Solve aptitude questions or write algorithmic code to maintain your preparation streak.
        </p>
      </div>

      <Button to="/aptitude" variant="primary" size="md" iconRight={<ArrowRightIcon className="w-4 h-4" />}>
        Start Practice
      </Button>
    </section>
  );
}

export default UnifiedNextActionCard;
