import React, { useState, useEffect, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import ContinueCard from "../components/dashboard/ContinueCard.jsx";
import WelcomeTour from "../components/dashboard/WelcomeTour.jsx";
import { getDashboardSummary } from "../services/dashboardService.js";

// Streamlined P1.2 Compact Dashboard Components
import DashboardCommandBar from "../components/dashboard/DashboardCommandBar.jsx";
import MissingFieldBanner from "../components/dashboard/MissingFieldBanner.jsx";
import PreparationLaunchpad from "../components/dashboard/PreparationLaunchpad.jsx";
import ActivityFeedTabs from "../components/dashboard/ActivityFeedTabs.jsx";
import PlacementReadinessSidebar from "../components/dashboard/PlacementReadinessSidebar.jsx";

// Feedback states
import ErrorState from "../components/ui/ErrorState.jsx";

/**
 * DashboardPage — Production Student Dashboard (Phase 1.2 Polish).
 *
 * Design Identity: Swiss Monochrome
 * Architecture:
 * - Zone 1: ~130px Hero Command Bar (Greeting, academic details, streak, next action)
 * - Zone 1b: MissingFieldBanner (Incomplete profile setup checklist, hidden when 100%)
 * - Zone 2: Compact 4-up Preparation Strip (~72px height per card with integrated stats)
 * - Zone 3: Two Equal-Height Columns (Left: Activity feed up to 5 rows; Right: Placement Readiness & embedded tabs)
 *
 * Target: Visible with 0 page scroll at 1440x900 and 1920x1080; at most a short scroll on 1366x768.
 */
function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
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

  // Loading skeleton
  if (!authLoading && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  if (loading) {
    return (
      <div
        className="max-w-[1240px] mx-auto space-y-3 animate-pulse"
        aria-busy="true"
        aria-label="Loading dashboard"
      >
        <div className="h-32 bg-card border border-border rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="h-[72px] bg-card border border-border rounded-xl" />
          <div className="h-[72px] bg-card border border-border rounded-xl" />
          <div className="h-[72px] bg-card border border-border rounded-xl" />
          <div className="h-[72px] bg-card border border-border rounded-xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
          <div className="h-80 bg-card border border-border rounded-xl" />
          <div className="h-80 bg-card border border-border rounded-xl" />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="max-w-[1240px] mx-auto py-6">
        <ErrorState message={error} onRetry={fetchSummary} />
      </div>
    );
  }

  // Merge context user with summary profile for instant consistency
  const activeUser = { ...user, ...(summary?.profile || {}) };
  const targetCompaniesList = summary?.targetCompanies || activeUser?.targetCompanies || [];

  return (
    <div className="rr-stagger max-w-[1240px] mx-auto space-y-3 sm:space-y-3.5 pb-2">
      {/* 1. Hero Command Bar (~130px) */}
      <DashboardCommandBar
        user={activeUser}
        readiness={summary?.readiness}
        streakDays={summary?.streakDays || 0}
        continueActivity={summary?.continueActivity}
        recommendation={summary?.recommendation}
      />

      {/* 1b. Missing Field Setup Banner (compact checklist shown only when profile is incomplete) */}
      <MissingFieldBanner profileCompletion={summary?.profileCompletion} />

      {/* 1c. Unfinished sessions fallback */}
      {summary && !summary.continueActivity && <ContinueCard />}

      <WelcomeTour />

      {/* 2. Compact 4-up Preparation Strip (~72px height per card) */}
      <PreparationLaunchpad
        preparation={summary?.preparation}
        targetCompaniesCount={targetCompaniesList.length}
      />

      {/* 3. Main Two-Column Grid (Left: Activity up to 5 rows; Right: Placement Readiness & embedded tabs) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 items-stretch">
        {/* Left Column: Recent Activity (fills column height to match readiness card) */}
        <div className="h-full flex flex-col">
          <ActivityFeedTabs
            activities={summary?.recentActivity || []}
            upcomingTests={summary?.upcomingTests || []}
          />
        </div>

        {/* Right Column: Placement Readiness Card with Embedded Tabs */}
        <div className="h-full flex flex-col">
          <PlacementReadinessSidebar
            readiness={summary?.readiness}
            weakAreas={summary?.weakAreas}
            targetCompanies={targetCompaniesList}
            preparationGoals={summary?.preparationGoals || activeUser?.preparationGoals || []}
            profileCompletion={summary?.profileCompletion}
          />
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
