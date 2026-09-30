import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card.jsx";
import { AptitudeIcon, CodingIcon, MockTestIcon, ArrowRightIcon, ClockIcon } from "../ui/Icons.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";

/**
 * RecentActivity — Activity feed reflecting real student submissions and attempts.
 * Truthful empty state when zero activity has occurred.
 */
function RecentActivity({ activities = [] }) {
  const hasActivity = Array.isArray(activities) && activities.length > 0;

  const getActivityIcon = (type) => {
    switch (type) {
      case "aptitude":
        return <AptitudeIcon className="w-4 h-4 text-blue-600" />;
      case "coding":
        return <CodingIcon className="w-4 h-4 text-violet-600" />;
      case "mock_test":
        return <MockTestIcon className="w-4 h-4 text-amber-600" />;
      default:
        return <ClockIcon className="w-4 h-4 text-slate-500" />;
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return null;
    const s = String(status).toLowerCase();
    if (s === "accepted" || s === "passed" || s === "submitted") {
      return <Badge variant="success" size="sm">{status}</Badge>;
    }
    if (s === "failed" || s === "wrong_answer") {
      return <Badge variant="danger" size="sm">{status.replace(/_/g, " ")}</Badge>;
    }
    return <Badge variant="default" size="sm">{status.replace(/_/g, " ")}</Badge>;
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return String(ts);
    }
  };

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between w-full">
            <CardTitle>Recent Activity</CardTitle>
            {hasActivity && (
              <Link
                to="/progress"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline"
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
                        {formatTimestamp(item.timestamp)}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 self-center">
                    {getStatusBadge(item.status)}
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
                Your recent preparation activity will appear here as you practice questions and complete tests.
              </p>
            </div>
          )}
        </CardContent>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
        <Link to="/aptitude" className="w-full no-underline">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
          >
            Start Practicing
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default RecentActivity;
