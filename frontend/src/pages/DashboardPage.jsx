import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getDashboardSummary } from "../services/dashboardService.js";

// Widgets
import WelcomeBanner from "../components/dashboard/WelcomeBanner.jsx";
import ProfileCompletionCard from "../components/dashboard/ProfileCompletionCard.jsx";
import PreparationOverview from "../components/dashboard/PreparationOverview.jsx";
import QuickActions from "../components/dashboard/QuickActions.jsx";
import RecentActivity from "../components/dashboard/RecentActivity.jsx";
import UpcomingTests from "../components/dashboard/UpcomingTests.jsx";
import PreparationStreak from "../components/dashboard/PreparationStreak.jsx";
import TargetCompanies from "../components/dashboard/TargetCompanies.jsx";
import DashboardBottomCTA from "../components/dashboard/DashboardBottomCTA.jsx";

// Feedback states
import { SkeletonCard } from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";

/**
 * DashboardPage — Production student dashboard.
 * Designed according to Apple + Linear + Premium University design direction.
 * Purely data-driven with zero fabricated statistics or phantom numbers.
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

  // Loading State with Skeletons matching exact grid layout
  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-6">
        {/* Welcome skeleton */}
        <div className="h-32 bg-white border border-slate-200 rounded-xl animate-pulse" />

        {/* Top 12-col grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <SkeletonCard />
          </div>
          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 h-full">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </div>

        {/* Actions skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Two-column grid skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
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

  // Merge context user with summary profile for immediate consistency
  const activeUser = { ...user, ...(summary?.profile || {}) };

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 sm:space-y-7 pb-10">
      {/* 1. Refined Welcome Header */}
      <WelcomeBanner firstName={activeUser.firstName} />

      {/* 2. Top Row (12-col grid): Profile Completion (4 cols) & Preparation Overview (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-stretch">
        <div className="lg:col-span-4">
          <ProfileCompletionCard user={activeUser} />
        </div>
        <div className="lg:col-span-8">
          <PreparationOverview preparation={summary?.preparation} />
        </div>
      </div>

      {/* 3. Primary Preparation Actions: "Continue Preparing" */}
      <QuickActions />

      {/* 4. Two-Column Activity & Assessments Grid (6 cols / 6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <RecentActivity activities={summary?.recentActivity} />
        <UpcomingTests tests={summary?.upcomingTests} />
      </div>

      {/* 5. Secondary Grid: Streak Tracker & Target Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <PreparationStreak streakDays={0} />
        <TargetCompanies companies={activeUser.targetCompanies || []} />
      </div>

      {/* 6. Restrained Bottom CTA */}
      <DashboardBottomCTA />
    </div>
  );
}

export default DashboardPage;
