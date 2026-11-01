import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  ClockIcon,
} from "../ui/Icons.jsx";
import RecentlyViewed from "./RecentlyViewed.jsx";
import { formatExecutionStatus } from "../../utils/formatters.js";

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
 * ActivityFeedTabs — Tabbed recent activity feed, showing up to 5 rows.
 * Includes "Full history" link to /progress.
 */
export function ActivityFeedTabs({
  activities = [],
  upcomingTests = [],
}) {
  const [activeTab, setActiveTab] = useState("activity"); // 'activity' | 'upcoming' | 'recent'

  const TABS = ["activity", "upcoming", "recent"];
  const handleKeyDown = (e) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    setActiveTab((prev) => {
      const i = TABS.indexOf(prev);
      return TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    });
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "aptitude":
        return <AptitudeIcon className="w-3.5 h-3.5 text-ink" />;
      case "coding":
        return <CodingIcon className="w-3.5 h-3.5 text-ink" />;
      case "mock_test":
        return <MockTestIcon className="w-3.5 h-3.5 text-ink" />;
      default:
        return <ClockIcon className="w-3.5 h-3.5 text-ink-2" />;
    }
  };

  const hasActivities = Array.isArray(activities) && activities.length > 0;
  const hasUpcoming = Array.isArray(upcomingTests) && upcomingTests.length > 0;

  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden h-full flex flex-col">
      {/* Tab Header */}
      <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between gap-3 bg-card">
        <div
          role="tablist"
          aria-label="Activity tabs"
          onKeyDown={handleKeyDown}
          className="flex items-center gap-1 p-0.5 bg-primary-soft rounded-lg"
        >
          <button
            type="button"
            role="tab"
            id="tab-activity"
            aria-selected={activeTab === "activity"}
            aria-controls="panel-activity"
            tabIndex={activeTab === "activity" ? 0 : -1}
            onClick={() => setActiveTab("activity")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "activity"
                ? "bg-card text-ink shadow-2xs font-bold"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            Recent Activity
            {hasActivities && (
              <span className="ml-1.5 text-[10px] py-0.2 px-1.5 rounded-full bg-primary-soft text-ink-2 font-mono">
                {activities.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            id="tab-upcoming"
            aria-selected={activeTab === "upcoming"}
            aria-controls="panel-upcoming"
            tabIndex={activeTab === "upcoming" ? 0 : -1}
            onClick={() => setActiveTab("upcoming")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-card text-ink shadow-2xs font-bold"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            Upcoming
            {hasUpcoming && (
              <span className="ml-1.5 text-[10px] py-0.2 px-1.5 rounded-full bg-primary-soft text-ink-2 font-mono">
                {upcomingTests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            role="tab"
            id="tab-recent"
            aria-selected={activeTab === "recent"}
            aria-controls="panel-recent"
            tabIndex={activeTab === "recent" ? 0 : -1}
            onClick={() => setActiveTab("recent")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "recent"
                ? "bg-card text-ink shadow-2xs font-bold"
                : "text-ink-2 hover:text-ink"
            }`}
          >
            Recently viewed
          </button>
        </div>

        {activeTab === "activity" ? (
          <Link
            to="/progress"
            className="text-xs font-semibold text-primary hover:underline no-underline"
          >
            Full history
          </Link>
        ) : activeTab === "upcoming" ? (
          <Link
            to="/mock-tests"
            className="text-xs font-semibold text-primary hover:underline no-underline"
          >
            Browse
          </Link>
        ) : (
          <span className="text-[11px] text-ink-2">Local</span>
        )}
      </div>

      {/* Tab Panel: Recent Activity (up to 5 rows) */}
      <div
        role="tabpanel"
        id="panel-activity"
        aria-labelledby="tab-activity"
        hidden={activeTab !== "activity"}
        className="p-3 flex-1 flex flex-col justify-between"
      >
        {hasActivities ? (
          <div className="divide-y divide-border">
            {activities.slice(0, 5).map((item, idx) => (
              <div
                key={item.id || idx}
                className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-primary-soft flex items-center justify-center shrink-0">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-ink truncate block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-ink-2 truncate block">
                      {formatExecutionStatus(item.subtitle)}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-ink-2 font-mono block">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center space-y-1.5 my-auto">
            <ClockIcon className="w-7 h-7 text-ink-2 mx-auto" />
            <p className="text-xs font-semibold text-ink m-0">
              No recent practice activity
            </p>
            <p className="text-[11px] text-ink-2 max-w-xs mx-auto m-0">
              Practice sessions and mock assessments will appear here automatically.
            </p>
          </div>
        )}
      </div>

      {/* Tab Panel: Upcoming Mock Tests */}
      <div
        role="tabpanel"
        id="panel-upcoming"
        aria-labelledby="tab-upcoming"
        hidden={activeTab !== "upcoming"}
        className="p-3 flex-1 flex flex-col justify-between"
      >
        {hasUpcoming ? (
          <div className="divide-y divide-border">
            {upcomingTests.slice(0, 5).map((test) => (
              <div
                key={test.id || test._id}
                className="py-2 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-ink truncate block">
                    {test.title}
                  </span>
                  <span className="text-[11px] text-ink-2 block">
                    {test.durationMinutes ? `${test.durationMinutes} mins` : "Timed test"}
                  </span>
                </div>
                <Link
                  to={`/mock-tests/${test.id || test._id}`}
                  className="px-2.5 py-1 text-[11px] font-semibold text-ink bg-card border border-border hover:bg-primary-soft rounded transition-colors no-underline"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center space-y-1.5 my-auto">
            <p className="text-xs font-semibold text-ink m-0">
              No scheduled upcoming tests
            </p>
            <p className="text-[11px] text-ink-2 m-0">
              Check the Mock Tests catalog for open assessments.
            </p>
          </div>
        )}
      </div>

      {/* Tab Panel: Recently Viewed */}
      <div
        role="tabpanel"
        id="panel-recent"
        aria-labelledby="tab-recent"
        hidden={activeTab !== "recent"}
        className="p-3 flex-1"
      >
        <RecentlyViewed limit={5} />
      </div>
    </div>
  );
}

export default ActivityFeedTabs;
