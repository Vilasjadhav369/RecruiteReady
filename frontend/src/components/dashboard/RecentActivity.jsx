import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card.jsx";
import { AptitudeIcon, CodingIcon, MockTestIcon, ArrowRightIcon, ClockIcon } from "../ui/Icons.jsx";
import { StatusBadge } from "../ui/StatusBadge.jsx";
import { Button } from "../ui/Button.jsx";

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
 * RecentActivity — Activity feed reflecting real student submissions and attempts.
 * Truthful empty state when zero activity has occurred.
 */
function RecentActivity({ activities = [] }) {
  const hasActivity = Array.isArray(activities) && activities.length > 0;

  const getActivityIcon = (type) => {
    switch (type) {
      case "aptitude":
        return <AptitudeIcon className="w-4 h-4 text-primary" />;
      case "coding":
        return <CodingIcon className="w-4 h-4 text-emerald-600" />;
      case "mock_test":
        return <MockTestIcon className="w-4 h-4 text-amber-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary-tint text-primary flex items-center justify-center shrink-0">
                <ClockIcon className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Recent Activity</CardTitle>
            </div>
            {hasActivity && (
              <Link
                to="/progress"
                className="text-xs font-semibold text-primary hover:text-primary-dark no-underline hover:underline"
              >
                View Analytics
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-2">
          {hasActivity ? (
            <div className="divide-y divide-slate-100">
              {activities.map((item, idx) => (
                <div key={item.id || idx} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 block truncate">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                        {item.subtitle}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono block mt-1">
                        {formatRelativeTime(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 self-center">
                    <StatusBadge status={item.status} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <ClockIcon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No activity yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Your recent practice submissions and test attempts will appear here as you solve questions.
              </p>
            </div>
          )}
        </CardContent>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
        <Button to="/aptitude" variant="outline" size="sm" fullWidth iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />} className="w-full">
            Start Practicing
          </Button>
      </div>
    </Card>
  );
}

export default RecentActivity;
