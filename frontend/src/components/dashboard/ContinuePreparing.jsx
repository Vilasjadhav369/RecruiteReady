import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { StatusBadge } from "../ui/StatusBadge.jsx";
import { Badge } from "../ui/Badge.jsx";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckIcon,
} from "../ui/Icons.jsx";

/**
 * Format timestamp into friendly relative or localized time.
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
    return String(ts);
  }
}

/**
 * ContinuePreparing — In-Progress / Resume preparation card.
 * If user has recent activity, offers a direct resume action.
 * If user has no attempts yet, offers a structured diagnostic start point.
 */
export function ContinuePreparing({ activities = [] }) {
  const latest = activities && activities.length > 0 ? activities[0] : null;

  if (latest) {
    const targetUrl =
      latest.type === "aptitude"
        ? "/aptitude"
        : latest.type === "coding"
        ? "/coding"
        : latest.type === "mock_test"
        ? "/mock-tests"
        : "/aptitude";

    const getIcon = () => {
      switch (latest.type) {
        case "aptitude":
          return <AptitudeIcon className="w-5 h-5 text-[#166534]" />;
        case "coding":
          return <CodingIcon className="w-5 h-5 text-[#166534]" />;
        case "mock_test":
          return <MockTestIcon className="w-5 h-5 text-[#166534]" />;
        default:
          return <ClockIcon className="w-5 h-5 text-[#166534]" />;
      }
    };

    return (
      <Card className="p-5 sm:p-6 bg-gradient-to-r from-white via-white to-[#F0FDF4] border border-[#22C55E]/30 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center shrink-0 mt-0.5">
              {getIcon()}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full border border-[#BBF7D0]">
                  Continue Where You Left Off
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {formatRelativeTime(latest.timestamp)}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 truncate">
                {latest.title}
              </h3>

              <div className="flex items-center gap-2.5 text-xs text-slate-600 flex-wrap">
                <span>{latest.subtitle}</span>
                <span className="text-slate-300">•</span>
                <StatusBadge status={latest.status} />
              </div>
            </div>
          </div>

          <div className="shrink-0 self-start sm:self-center">
            <Link to={targetUrl} className="no-underline">
              <Button
                variant="primary"
                size="md"
                iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
              >
                Resume Practice
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    );
  }

  // Fallback for new students with zero attempts yet (honest recommendation)
  return (
    <Card className="p-5 sm:p-6 bg-gradient-to-r from-white to-[#F0FDF4] border border-[#22C55E]/30 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] flex items-center justify-center shrink-0 mt-0.5 text-[#166534]">
            <AptitudeIcon className="w-5 h-5" />
          </div>

          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="brand" size="sm">
                Recommended First Step
              </Badge>
              <span className="text-xs text-slate-500">Diagnostic Practice</span>
            </div>

            <h3 className="text-base font-bold text-slate-900">
              Start with Quantitative Aptitude Foundations
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-xl">
              Establish your preparation baseline. Attempt foundational questions in number systems, percentages, and logical deduction.
            </p>
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <Link to="/aptitude" className="no-underline">
            <Button
              variant="primary"
              size="md"
              iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
            >
              Start First Practice
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default ContinuePreparing;
