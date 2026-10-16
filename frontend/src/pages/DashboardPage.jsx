import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import RecentlyViewed from "../components/dashboard/RecentlyViewed.jsx";
import { getDashboardSummary } from "../services/dashboardService.js";

// High-Density, Streamlined P1 Dashboard Components
import DashboardCommandBar from "../components/dashboard/DashboardCommandBar.jsx";
import MissingFieldBanner from "../components/dashboard/MissingFieldBanner.jsx";
import PreparationLaunchpad from "../components/dashboard/PreparationLaunchpad.jsx";
import ActivityFeedTabs from "../components/dashboard/ActivityFeedTabs.jsx";
import PlacementReadinessSidebar from "../components/dashboard/PlacementReadinessSidebar.jsx";

// Feedback states
import ErrorState from "../components/ui/ErrorState.jsx";

/**
 * DashboardPage — Production Student Dashboard (Phase 1 Refactor).
 *
 * Design Identity: Apple + Linear + Premium University
 * Information Architecture:
 * - Zone 1: Unified Command Bar (Greeting, credentials, streak, and singular next action)
 * - Zone 1b: MissingFieldBanner (Incomplete profile setup checklist, hidden when 100%)
 * - Zone 2: Singular Preparation Launchpad (Aptitude, Coding, Mock Tests, Companies with live metrics)
 * - Zone 3: Asymmetric Desktop Grid (Left: Activity feed, Right: Placement intelligence)
 * - Responsive Ordering: On mobile, intelligence and goals are prioritized before the activity feed.
 *
 * Target: Comfortably fits within <= 1.5 viewport heights on 1280x800 desktop.
 */
function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDashboardSummary();
      setSummary(data);
    } catch (err) {
      console.error("Dashboard summary fetch failed:", err);
      setError("Unable to load your dashboard data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // High-density loading skeleton
  if (loading) {
    return (
      <div
        className="max-w-[1240px] mx-auto space-y-4 sm:space-y-5 animate-pulse"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        {/* Command Bar Skeleton */}
        <div className="h-28 bg-white border border-slate-200 rounded-xl" />

        {/* Unified Launchpad Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-24 bg-white border border-slate-200 rounded-xl" />
          <div className="h-24 bg-white border border-slate-200 rounded-xl" />
          <div className="h-24 bg-white border border-slate-200 rounded-xl" />
          <div className="h-24 bg-white border border-slate-200 rounded-xl" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-64 bg-white border border-slate-200 rounded-xl" />
          </div>
          <div className="lg:col-span-4 space-y-4">
            <div className="h-44 bg-white border border-slate-200 rounded-xl" />
            <div className="h-36 bg-white border border-slate-200 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-[1240px] mx-auto py-8">
        <ErrorState message={error} onRetry={fetchSummary} />
      </div>
    );
  }

  // Merge context user with summary profile for instant consistency
  const activeUser = { ...user, ...(summary?.profile || {}) };
  const targetCompaniesList = summary?.targetCompanies || activeUser?.targetCompanies || [];

  return (
    <div className="rr-stagger max-w-[1240px] mx-auto space-y-3.5 sm:space-y-4 pb-4">
      {/* 1. Unified Command Bar: Greeting, Credentials, Streak & Singular Next Action */}
      <DashboardCommandBar
        user={activeUser}
        readiness={summary?.readiness}
        streakDays={summary?.streakDays || 0}
        continueActivity={summary?.continueActivity}
        recommendation={summary?.recommendation}
      />

      {/* 1b. Missing Field Setup Banner (compact checklist shown only when profile is incomplete) */}
      <MissingFieldBanner profileCompletion={summary?.profileCompletion} />

      {/* 2. Unified Preparation Launchpad: 4 Core Modules with Live Metrics */}
      <PreparationLaunchpad
        preparation={summary?.preparation}
        targetCompaniesCount={targetCompaniesList.length}
      />

      {/* 3. Primary Dashboard Layout: Asymmetric 8:4 Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left Column (8 cols on desktop): Accessible Tabbed Activity & Upcoming Assessments */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* Desktop Activity Feed */}
          <div className="hidden lg:block">
            <ActivityFeedTabs
              activities={summary?.recentActivity || []}
              upcomingTests={summary?.upcomingTests || []}
            />
          </div>
          <RecentlyViewed />
        </div>

        {/* Right Column (4 cols on desktop, ordered above activity feed on mobile): Placement Intelligence */}
        <div className="lg:col-span-4">
          <PlacementReadinessSidebar
            readiness={summary?.readiness}
            weakAreas={summary?.weakAreas}
            targetCompanies={targetCompaniesList}
            preparationGoals={summary?.preparationGoals || activeUser?.preparationGoals || []}
            profileCompletion={summary?.profileCompletion}
          />
        </div>

        {/* Mobile Activity Feed (rendered below sidebar on mobile so readiness is never buried) */}
        <div className="block lg:hidden col-span-1">
          <ActivityFeedTabs
            activities={summary?.recentActivity || []}
            upcomingTests={summary?.upcomingTests || []}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
