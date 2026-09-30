import { useState, useEffect, useCallback } from "react";
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

// Feedback states
import { SkeletonCard } from "../components/LoadingSkeleton.jsx";
import ErrorState from "../components/ErrorState.jsx";

/**
 * DashboardPage — Production student dashboard.
 * Purely data-driven with no fabricated statistics.
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
      setError("We couldn't load your dashboard data. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Loading State
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-36 bg-white border border-[#D9E2EC] rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SkeletonCard />
          <div className="lg:col-span-2">
            <SkeletonCard />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-12 my-8 shadow-xs">
        <ErrorState message={error} onRetry={fetchSummary} />
      </div>
    );
  }

  // Merge context user with summary profile for immediate consistency
  const activeUser = { ...user, ...(summary?.profile || {}) };

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Welcome Banner */}
      <WelcomeBanner firstName={activeUser.firstName} />

      {/* 2. Top Row: Profile Completion & Preparation Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-1">
          <ProfileCompletionCard user={activeUser} />
        </div>
        <div className="lg:col-span-2">
          <PreparationOverview preparation={summary?.preparation} />
        </div>
      </div>

      {/* 3. Quick Actions */}
      <QuickActions />

      {/* 4. Two-Column: Recent Activity & Upcoming Tests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <RecentActivity activities={summary?.recentActivity} />
        <UpcomingTests tests={summary?.upcomingTests} />
      </div>

      {/* 5. Bottom Row: Streak & Target Companies */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <PreparationStreak streakDays={0} />
        <TargetCompanies companies={activeUser.targetCompanies || []} />
      </div>
    </div>
  );
}

export default DashboardPage;
