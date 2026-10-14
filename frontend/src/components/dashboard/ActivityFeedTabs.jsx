import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  ClockIcon,
  CalendarIcon,
} from "../ui/Icons.jsx";
import { Badge } from "../ui/Badge.jsx";

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
 * ActivityFeedTabs — Accessible tabbed widget consolidating Recent Activity & Upcoming Assessments.
 * 
 * Features:
 * - WAI-ARIA compliant tab navigation (role="tablist", role="tab", aria-selected, aria-controls).
 * - Keyboard support (Left/Right Arrow keys cycle tabs seamlessly).
 * - Honest empty states when student has 0 activities or 0 upcoming tests.
 * - Saves ~250px of vertical space compared to two stacked cards.
 */
export function ActivityFeedTabs({
  activities = [],
  upcomingTests = [],
}) {
  const [activeTab, setActiveTab] = useState("activity"); // 'activity' | 'upcoming'

  const handleKeyDown = (e) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActiveTab((prev) => (prev === "activity" ? "upcoming" : "activity"));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActiveTab((prev) => (prev === "activity" ? "upcoming" : "activity"));
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "aptitude":
        return <AptitudeIcon className="w-3.5 h-3.5 text-blue-600" />;
      case "coding":
        return <CodingIcon className="w-3.5 h-3.5 text-emerald-600" />;
      case "mock_test":
        return <MockTestIcon className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <ClockIcon className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getDifficultyBadge = (difficulty) => {
    const d = String(difficulty || "").toLowerCase();
    if (d === "easy") return <Badge variant="success" size="sm">Easy</Badge>;
    if (d === "hard") return <Badge variant="danger" size="sm">Hard</Badge>;
    return <Badge variant="warning" size="sm">Medium</Badge>;
  };

  const hasActivities = Array.isArray(activities) && activities.length > 0;
  const hasUpcoming = Array.isArray(upcomingTests) && upcomingTests.length > 0;

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl shadow-xs overflow-hidden">
      {/* Tab Header with Accessible ARIA semantics */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50">
        <div
          role="tablist"
          aria-label="Activity and upcoming assessments tabs"
          onKeyDown={handleKeyDown}
          className="flex items-center gap-1 p-0.5 bg-slate-200/70 rounded-lg"
        >
          <button
            type="button"
            role="tab"
            id="tab-activity"
            aria-selected={activeTab === "activity"}
            aria-controls="panel-activity"
            tabIndex={activeTab === "activity" ? 0 : -1}
            onClick={() => setActiveTab("activity")}
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "activity"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Recent Activity
            {hasActivities && (
              <span className="ml-1.5 text-[10px] py-0.2 px-1.5 rounded-full bg-slate-100 text-slate-600 font-mono">
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
            className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              activeTab === "upcoming"
                ? "bg-white text-slate-900 shadow-2xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Upcoming Mock Tests
            {hasUpcoming && (
              <span className="ml-1.5 text-[10px] py-0.2 px-1.5 rounded-full bg-slate-100 text-slate-600 font-mono">
                {upcomingTests.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === "activity" ? (
          <Link
            to="/progress"
            className="text-xs font-semibold text-primary hover:text-primary-dark no-underline hover:underline hidden sm:inline"
          >
            Full History
          </Link>
        ) : (
          <Link
            to="/mock-tests"
            className="text-xs font-semibold text-primary hover:text-primary-dark no-underline hover:underline hidden sm:inline"
          >
            Browse Tests
          </Link>
        )}
      </div>

      {/* Tab Panel: Recent Activity */}
      <div
        role="tabpanel"
        id="panel-activity"
        aria-labelledby="tab-activity"
        hidden={activeTab !== "activity"}
        className="p-4"
      >
        {hasActivities ? (
          <div className="divide-y divide-slate-100">
            {activities.map((item, idx) => (
              <div
                key={item.id || idx}
                className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-900 truncate block">
                      {item.title}
                    </span>
                    <span className="text-[11px] text-slate-500 truncate block">
                      {item.subtitle}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-[11px] text-slate-400 font-mono block">
                    {formatRelativeTime(item.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <ClockIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-800">
              No recent practice activity
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Your genuine submissions, aptitude sets, and mock assessments will appear here automatically.
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
        className="p-4"
      >
        {hasUpcoming ? (
          <div className="space-y-2.5">
            {upcomingTests.map((test, idx) => (
              <div
                key={test.id || idx}
                className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/80 flex items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
              >
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {test.title}
                    </span>
                    {getDifficultyBadge(test.difficulty)}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>{test.durationMinutes || 60} mins</span>
                    <span>•</span>
                    <span>{test.totalQuestions || 30} questions</span>
                  </div>
                </div>

                <Link
                  to="/mock-tests"
                  className="px-2.5 py-1 text-xs font-semibold text-primary hover:text-primary-dark rounded bg-white border border-slate-200 hover:border-slate-300 transition-colors shrink-0 no-underline shadow-2xs"
                >
                  View
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center space-y-2">
            <CalendarIcon className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-semibold text-slate-800">
              No mock tests currently scheduled
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Check back soon or explore self-paced aptitude and coding practice sets.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ActivityFeedTabs;
