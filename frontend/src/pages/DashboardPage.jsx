import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getDashboardSummary } from "../services/dashboardService.js";

// Widgets
import WelcomeBanner from "../components/dashboard/WelcomeBanner.jsx";
import RecommendationCard from "../components/dashboard/RecommendationCard.jsx";
import ContinuePreparing from "../components/dashboard/ContinuePreparing.jsx";
import QuickActions from "../components/dashboard/QuickActions.jsx";
import PreparationOverview from "../components/dashboard/PreparationOverview.jsx";
import PlacementReadinessCard from "../components/dashboard/PlacementReadinessCard.jsx";
import WeakAreasCard from "../components/dashboard/WeakAreasCard.jsx";
import TargetCompanies from "../components/dashboard/TargetCompanies.jsx";
import ProfileCompletionCard from "../components/dashboard/ProfileCompletionCard.jsx";
import RecentActivity from "../components/dashboard/RecentActivity.jsx";
import UpcomingTests from "../components/dashboard/UpcomingTests.jsx";
import PreparationStreak from "../components/dashboard/PreparationStreak.jsx";
import DashboardBottomCTA from "../components/dashboard/DashboardBottomCTA.jsx";

// Feedback states
import { SkeletonCard } from "../components/ui/Skeleton.jsx";
import ErrorState from "../components/ui/ErrorState.jsx";

/**
 * DashboardPage — Production student dashboard.
 * Designed according to Apple + Linear + Premium University design direction.
 * Purely data-driven with zero fabricated statistics or phantom numbers.
 * Personalized answering:
 * 1. Who am I? (WelcomeBanner)
 * 2. What should I do next? (ContinuePreparing & RecommendationCard)
 * 3. How am I progressing? (PreparationOverview & PlacementReadinessCard)
 * 4. What am I weak at? (WeakAreasCard)
 * 5. Which companies am I targeting? (TargetCompanies)
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

        {/* Next step recommendation skeleton */}
        <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />

        {/* Quick actions skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Preparation overview skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Continue preparing skeleton */}
        <div className="h-24 bg-white border border-slate-200 rounded-xl animate-pulse" />

        {/* Readiness and Weak areas skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>

        {/* Target companies & Profile skeleton */}
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
      {/* 1. Dashboard Header / Personalized Welcome Greeting */}
      <WelcomeBanner
        firstName={activeUser.firstName}
        college={activeUser.college}
        branch={activeUser.branch}
        graduationYear={activeUser.graduationYear}
        preparationLevel={activeUser.preparationLevel}
      />

      {/* 2. Today's Recommendation (Deterministic Next Step) */}
      <RecommendationCard recommendation={summary?.recommendation} />

      {/* 3. Continue Preparing (Resume In-Progress Assessment or Start Practice) */}
      <ContinuePreparing
        continueActivity={summary?.continueActivity}
        activities={summary?.recentActivity}
      />

      {/* 4. Quick Actions (4 primary modules: Aptitude, Coding, Mock Tests, Companies) */}
      <QuickActions />

      {/* 5. Preparation Overview (Real aggregate metrics via StatCards) */}
      <PreparationOverview preparation={summary?.preparation} />

      {/* 6. Placement Readiness & Targeted Weak Areas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <PlacementReadinessCard readiness={summary?.readiness} />
        <WeakAreasCard weakAreas={summary?.weakAreas} />
      </div>

      {/* 7. Target Companies & Profile Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <TargetCompanies
          companies={summary?.targetCompanies || activeUser.targetCompanies || []}
        />
        <ProfileCompletionCard user={activeUser} />
      </div>

      {/* 8. Two-Column Activity & Upcoming Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
        <RecentActivity activities={summary?.recentActivity} />
        <UpcomingTests tests={summary?.upcomingTests} />
      </div>

      {/* 9. Consistency Tracker / Preparation Streak */}
      <div className="grid grid-cols-1 gap-5 sm:gap-6">
        <PreparationStreak streakDays={summary?.streakDays || 0} />
      </div>

      {/* 10. Placement Season Guidance Strategy Banner */}
      <DashboardBottomCTA />
    </div>
  );
}

export default DashboardPage;
