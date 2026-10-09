import React from "react";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompaniesIcon,
  ArrowRightIcon,
  ClockIcon,
} from "../ui/Icons.jsx";

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
 * ContinuePreparing — In-Progress / Resume preparation card.
 * Answers: "What should I do next?" and "Where did I leave off?"
 * Displays either real unfinished activity with direct resume link,
 * or clean onboarding module selector if no unfinished work exists.
 */
export function ContinuePreparing({ continueActivity = null, activities = [] }) {
  // If dedicated continueActivity object provided, prioritize it
  const activeItem = continueActivity || (activities && activities.length > 0 ? activities[0] : null);

  if (activeItem) {
    const getIcon = () => {
      switch (activeItem.type) {
        case "aptitude":
          return <AptitudeIcon className="w-5 h-5 text-primary" />;
        case "coding":
          return <CodingIcon className="w-5 h-5 text-primary" />;
        case "mock_test":
          return <MockTestIcon className="w-5 h-5 text-primary" />;
        default:
          return <ClockIcon className="w-5 h-5 text-primary" />;
      }
    };

    const targetUrl =
      activeItem.actionLink ||
      (activeItem.type === "aptitude"
        ? "/aptitude"
        : activeItem.type === "coding"
        ? "/coding"
        : activeItem.type === "mock_test"
        ? "/mock-tests"
        : "/aptitude");

    const actionText = activeItem.actionText || "Resume";

    return (
      <Card className="p-5 sm:p-6 bg-gradient-to-r from-white via-white to-primary/5 border border-primary/20 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary-tint border border-primary-border flex items-center justify-center shrink-0 mt-0.5">
              {getIcon()}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-tint px-2 py-0.5 rounded-full border border-primary-border">
                  Continue Where You Left Off
                </span>
                {activeItem.startedAt && (
                  <span className="text-xs text-slate-400 font-mono">
                    {formatRelativeTime(activeItem.startedAt)}
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 truncate">
                {activeItem.title}
              </h3>

              <div className="flex items-center gap-2.5 text-xs text-slate-600 flex-wrap">
                <span>{activeItem.subtitle}</span>
                {activeItem.progress && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-medium text-primary">{activeItem.progress}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Button
              to={targetUrl}
              variant="primary"
              size="md"
              iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
            >
              {actionText}
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // Meaningful Empty State: No unfinished work
  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Start Your Preparation
          </span>
          <h3 className="text-base font-bold text-slate-900">
            No active session in progress
          </h3>
          <p className="text-xs text-slate-500">
            Pick a core placement module below to begin today's practice session.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button to="/aptitude" variant="outline" size="sm" iconLeft={<AptitudeIcon className="w-3.5 h-3.5 text-primary" />}>
            Aptitude
          </Button>
          <Button to="/coding" variant="outline" size="sm" iconLeft={<CodingIcon className="w-3.5 h-3.5 text-primary" />}>
            Coding
          </Button>
          <Button to="/mock-tests" variant="outline" size="sm" iconLeft={<MockTestIcon className="w-3.5 h-3.5 text-primary" />}>
            Mock Test
          </Button>
          <Button to="/companies" variant="outline" size="sm" iconLeft={<CompaniesIcon className="w-3.5 h-3.5 text-primary" />}>
            Companies
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ContinuePreparing;
