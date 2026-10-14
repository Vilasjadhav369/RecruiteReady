import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CompanyIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  FlagIcon,
  RefreshIcon,
  AlertCircleIcon,
  CheckIcon,
  SparklesIcon,
} from "../ui/Icons.jsx";
import { ProgressBar } from "../ui/ProgressBar.jsx";
import { getGoals, toggleGoal } from "../../services/goalService.js";

/**
 * Format fallback legacy goal tokens into human-friendly labels.
 */
function formatLegacyGoalLabel(goal) {
  if (!goal || typeof goal !== "string") return "";
  const trimmed = goal.trim();
  const lower = trimmed.toLowerCase();

  const legacyMap = {
    coding: "Data Structures & Algorithms",
    aptitude: "Quantitative & Logical Aptitude",
    core_cs: "Core Computer Science Fundamentals",
    interview: "Interview & Mock Preparation",
    system_design: "System Design Foundations",
  };

  return legacyMap[lower] || trimmed;
}

/**
 * Resolve the contextual practice action destination for automated goals.
 */
function getGoalActionLink(goal) {
  const metricType = goal?.calculatedProgress?.metricType;
  const category = (goal?.category || "").toLowerCase();

  if (metricType === "coding_distinct_solved" || category.includes("coding")) {
    return { to: "/coding", label: "Solve Problems" };
  }
  if (metricType === "aptitude_aggregate_accuracy" || category.includes("aptitude")) {
    return { to: "/aptitude", label: "Practice Tests" };
  }
  if (metricType === "mock_submitted_count" || category.includes("mock")) {
    return { to: "/mock-tests", label: "Take Mock Test" };
  }
  return null;
}

/**
 * PlacementReadinessSidebar — Compact, highly organized intelligence sidebar.
 * Apple + Linear aesthetic: Dense, structured, clean.
 *
 * Contains:
 * 1. Placement Readiness Snapshot (Score / 100 & 4-part sub-score breakdown)
 * 2. Targeted Weak Areas (Highest priority skills requiring attention)
 * 3. Target Companies Quick-Track (Bookmarked/target companies from profile)
 * 4. Preparation Goals & Milestones (Live automated tracking, verified vs self-reported)
 * 5. Profile Completion Progress (Only if incomplete)
 */
export function PlacementReadinessSidebar({
  readiness = null,
  weakAreas = null,
  targetCompanies = [],
  preparationGoals = [],
  profileCompletion = null,
}) {
  const hasReadiness = readiness?.score !== null && readiness?.status !== "insufficient_data";
  const score = readiness?.score ?? 0;
  const breakdown = readiness?.breakdown;

  const weakItems = weakAreas?.items || [];
  const companies = Array.isArray(targetCompanies) ? targetCompanies : [];

  // Goal API state
  const [goalsData, setGoalsData] = useState([]);
  const [goalsSummary, setGoalsSummary] = useState(null);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [goalsError, setGoalsError] = useState(null);
  const [togglingGoalId, setTogglingGoalId] = useState(null);
  const [toggleError, setToggleError] = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoadingGoals(true);
    setGoalsError(null);
    setToggleError(null);
    try {
      const data = await getGoals();
      setGoalsData(data.goals || []);
      setGoalsSummary(data.summary || null);
    } catch (err) {
      console.error("Failed to load preparation goals:", err);
      setGoalsError("Unable to load live goal tracking data.");
    } finally {
      setLoadingGoals(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // Handle explicit toggle
  const handleToggle = async (goal) => {
    if (!goal?._id || togglingGoalId) return;

    // Explicit desired state: if currently manually completed or verified, reopen it (false), else mark complete (true)
    const targetState = !goal.isCompleted;

    setTogglingGoalId(goal._id);
    setToggleError(null);

    try {
      const res = await toggleGoal(goal._id, targetState);
      const updatedGoal = res?.goal;

      if (updatedGoal) {
        setGoalsData((prev) =>
          prev.map((g) => (g._id === updatedGoal._id ? updatedGoal : g))
        );
        // Refresh full goals list in background for updated summary counters
        const fresh = await getGoals();
        setGoalsData(fresh.goals || []);
        setGoalsSummary(fresh.summary || null);
      }
    } catch (err) {
      console.error("Failed to toggle goal state:", err);
      const msg = err.response?.data?.message || "Failed to update goal completion status.";
      setToggleError(msg);
    } finally {
      setTogglingGoalId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "placement_ready":
        return { text: "Placement Ready", classes: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "progressing":
        return { text: "Progressing", classes: "text-blue-700 bg-blue-50 border-blue-200" };
      default:
        return { text: "Building Foundations", classes: "text-amber-700 bg-amber-50 border-amber-200" };
    }
  };

  const statusBadge = getStatusBadge(readiness?.status);

  // Fallback string goals if goal API returns empty array but props have legacy strings
  const fallbackGoals = Array.isArray(preparationGoals)
    ? preparationGoals.filter((g) => typeof g === "string" && g.trim().length > 0)
    : [];

  return (
    <aside aria-label="Placement intelligence summary" className="space-y-3">
      {/* 1. Placement Readiness Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Placement Readiness Index
          </h2>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${statusBadge.classes}`}>
            {statusBadge.text}
          </span>
        </div>

        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {hasReadiness ? score : "—"}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>

          <Link
            to="/progress"
            className="text-xs font-semibold text-primary hover:text-primary-dark no-underline flex items-center gap-1 group"
          >
            Details
            <ArrowRightIcon className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {hasReadiness && breakdown ? (
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span>Coding Mastery</span>
              <span className="font-mono font-semibold text-slate-900">{breakdown.codingScore}/30</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Aptitude Accuracy</span>
              <span className="font-mono font-semibold text-slate-900">{breakdown.aptitudeScore}/30</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Timed Mocks</span>
              <span className="font-mono font-semibold text-slate-900">{breakdown.mockTestScore}/25</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Profile Definition</span>
              <span className="font-mono font-semibold text-slate-900">{breakdown.profileScore}/15</span>
            </div>
          </div>
        ) : (
          <p className="text-[11px] text-slate-500 leading-relaxed pt-1 border-t border-slate-100">
            Solve questions and complete mock assessments to generate your transparent placement index.
          </p>
        )}
      </div>

      {/* 2. Targeted Weak Areas Card */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Priority Skill Focus
          </h2>
          <span className="text-[11px] text-slate-400 font-medium">
            {weakItems.length > 0
              ? `${weakItems.length} gap${weakItems.length > 1 ? "s" : ""}`
              : hasReadiness
              ? "All clear"
              : "Baseline needed"}
          </span>
        </div>

        {weakItems.length > 0 ? (
          <div className="space-y-2">
            {weakItems.slice(0, 2).map((item, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/90 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <span className="text-xs font-bold text-slate-900 truncate block">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-semibold text-amber-700 block mt-0.5">
                    {item.metric}
                  </span>
                </div>

                <Link
                  to={item.actionLink || "/aptitude"}
                  className="px-2 py-1 text-[11px] font-semibold text-primary hover:text-primary-dark rounded bg-white border border-slate-200 hover:border-slate-300 transition-colors shrink-0 no-underline shadow-2xs"
                >
                  {item.actionText || "Practice"}
                </Link>
              </div>
            ))}
          </div>
        ) : !hasReadiness ? (
          <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2">
            <SparklesIcon className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[11px] leading-relaxed block font-medium text-blue-950">
                No practice data recorded yet.
              </span>
              <span className="text-[11px] text-blue-800 block">
                Complete an aptitude session or coding problem to identify your focus areas.
              </span>
              <Link
                to="/aptitude"
                className="text-[11px] font-semibold text-primary inline-flex items-center gap-1 hover:underline pt-0.5 no-underline"
              >
                Start first practice session →
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">
              All core domains performing above target threshold. Maintain practice consistency!
            </span>
          </div>
        )}
      </div>

      {/* 3. Target Companies Pill List */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <CompanyIcon className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Target Companies
            </h2>
          </div>
          <Link
            to="/profile"
            className="text-xs font-semibold text-primary hover:text-primary-dark no-underline"
          >
            Edit
          </Link>
        </div>

        {companies.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {companies.slice(0, 5).map((comp, idx) => {
              const name = typeof comp === "object" ? comp.name : comp;
              const logoUrl = typeof comp === "object" ? comp.logoUrl : "";
              const targetLink =
                typeof comp === "object"
                  ? comp.link || (comp.slug ? `/companies/${encodeURIComponent(comp.slug)}` : comp.id ? `/companies/${comp.id}` : `/companies?search=${encodeURIComponent(name)}`)
                  : `/companies?search=${encodeURIComponent(name)}`;

              return (
                <Link
                  key={idx}
                  to={targetLink}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors no-underline"
                >
                  {logoUrl ? (
                    <img src={logoUrl} alt="" className="w-3.5 h-3.5 rounded object-contain shrink-0" />
                  ) : (
                    <span className="w-3.5 h-3.5 rounded bg-primary-tint text-primary text-[9px] font-bold flex items-center justify-center shrink-0">
                      {name.charAt(0)}
                    </span>
                  )}
                  <span className="truncate max-w-[120px]">{name}</span>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="text-xs text-slate-600">No target companies selected</p>
            <Link
              to="/profile"
              className="text-[11px] font-semibold text-primary hover:text-primary-dark inline-block no-underline"
            >
              Add target companies in profile →
            </Link>
          </div>
        )}
      </div>

      {/* 4. Preparation Goals Card (Integrated P1.6 Engine) */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-3.5 sm:p-4 shadow-xs space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FlagIcon className="w-3.5 h-3.5 text-primary" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Preparation Goals
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {goalsSummary && goalsSummary.totalGoals > 0 && (
              <span className="text-[11px] font-mono font-semibold text-slate-500">
                {goalsSummary.completedGoals}/{goalsSummary.totalGoals}
              </span>
            )}
            <Link
              to="/profile"
              className="text-xs font-semibold text-primary hover:text-primary-dark no-underline"
            >
              Edit
            </Link>
          </div>
        </div>

        {/* Global Toggle Error Feedback */}
        {toggleError && (
          <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-[11px] text-rose-700 flex items-center justify-between gap-1">
            <span className="truncate">{toggleError}</span>
            <button
              type="button"
              onClick={() => setToggleError(null)}
              className="text-rose-600 hover:text-rose-800 font-bold px-1"
            >
              ×
            </button>
          </div>
        )}

        {/* Loading State */}
        {loadingGoals ? (
          <div className="space-y-2 animate-pulse" aria-busy="true" aria-label="Loading preparation goals">
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg" />
            <div className="h-14 bg-slate-50 border border-slate-100 rounded-lg" />
          </div>
        ) : goalsError ? (
          /* Error State with Retry */
          <div className="p-3 rounded-lg bg-rose-50/60 border border-rose-200 text-center space-y-1.5">
            <p className="text-xs text-rose-700">{goalsError}</p>
            <button
              type="button"
              onClick={fetchGoals}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 hover:underline cursor-pointer"
            >
              <RefreshIcon className="w-3 h-3" />
              Retry
            </button>
          </div>
        ) : goalsData.length > 0 ? (
          /* Active Structured Goals Cards */
          <div className="space-y-2.5">
            {goalsData.slice(0, 4).map((goal) => {
              const isAutomated = goal.evaluationType === "automated" && goal.calculatedProgress;
              const isVerified = Boolean(goal.calculatedProgress?.isSatisfied);
              const isSelfReported = Boolean(goal.manualCompleted) && !isVerified;
              const action = getGoalActionLink(goal);
              const isUpdating = togglingGoalId === goal._id;

              return (
                <div
                  key={goal._id}
                  className={`p-2.5 rounded-lg border transition-all ${
                    goal.isCompleted
                      ? "bg-emerald-50/30 border-emerald-200/80"
                      : "bg-slate-50/70 border-slate-200/90"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      {/* Goal Title */}
                      <p className={`text-xs font-semibold leading-snug break-words ${
                        goal.isCompleted ? "text-slate-700 line-through" : "text-slate-900"
                      }`}>
                        {goal.text}
                      </p>

                      {/* Status / Metric Note */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {isAutomated ? (
                          <span className="text-[10px] font-medium text-slate-500">
                            {goal.calculatedProgress.statusNote || `${goal.calculatedProgress.current} / ${goal.calculatedProgress.target} ${goal.calculatedProgress.unit}`}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">
                            Self-managed goal
                          </span>
                        )}

                        {/* Status Label Pill */}
                        {isVerified ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                            Verified
                          </span>
                        ) : isSelfReported ? (
                          <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                            Self-Reported
                          </span>
                        ) : (
                          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                            In Progress
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Accessible Completion / Reopen Toggle Button */}
                    <button
                      type="button"
                      onClick={() => handleToggle(goal)}
                      disabled={isUpdating}
                      className={`shrink-0 w-6 h-6 rounded border flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary ${
                        goal.isCompleted
                          ? "bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700"
                          : "bg-white border-slate-300 text-transparent hover:border-slate-400"
                      } ${isUpdating ? "opacity-50 cursor-wait" : ""}`}
                      aria-label={
                        goal.isCompleted
                          ? `Reopen goal: ${goal.text}`
                          : `Mark goal as complete: ${goal.text}`
                      }
                      title={
                        goal.isCompleted
                          ? "Mark incomplete / Reopen"
                          : "Mark as complete"
                      }
                    >
                      {goal.isCompleted && <CheckIcon className="w-3.5 h-3.5 stroke-2" />}
                    </button>
                  </div>

                  {/* Progress Bar for Automated Goals */}
                  {isAutomated && (
                    <div className="mt-2">
                      <ProgressBar
                        value={goal.calculatedProgress.percentage}
                        size="sm"
                        variant={isVerified ? "success" : "primary"}
                        label={`${goal.text} progress`}
                      />
                    </div>
                  )}

                  {/* Contextual Action Link */}
                  {action && !goal.isCompleted && (
                    <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex justify-end">
                      <Link
                        to={action.to}
                        className="text-[11px] font-semibold text-primary hover:text-primary-dark inline-flex items-center gap-1 group no-underline"
                      >
                        {action.label}
                        <ArrowRightIcon className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : fallbackGoals.length > 0 ? (
          /* Backward-Compatible Fallback for un-migrated string goals */
          <ul className="space-y-2 list-none p-0 m-0">
            {fallbackGoals.slice(0, 4).map((rawGoal, idx) => {
              const label = formatLegacyGoalLabel(rawGoal);
              return (
                <li
                  key={idx}
                  className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-start gap-2"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 mt-1.5"
                    aria-hidden="true"
                  />
                  <span className="text-xs font-medium text-slate-700 leading-snug break-words">
                    {label}
                  </span>
                </li>
              );
            })}
          </ul>
        ) : (
          /* Empty State */
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center space-y-1">
            <p className="text-xs text-slate-600">No preparation goals defined yet</p>
            <Link
              to="/profile"
              className="text-[11px] font-semibold text-primary hover:text-primary-dark inline-block no-underline"
            >
              Set preparation goals in profile →
            </Link>
          </div>
        )}
      </div>

      {/* 5. Profile Completion Progress (Only if < 100%) */}
      {profileCompletion && profileCompletion.percentage < 100 && (
        <div className="bg-white border border-slate-200/90 rounded-xl p-4 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-900">
              Profile Completeness
            </span>
            <span className="text-xs font-bold font-mono text-slate-700">
              {profileCompletion.percentage}%
            </span>
          </div>

          <ProgressBar value={profileCompletion.percentage} size="sm" variant="primary" />

          <p className="text-[11px] text-slate-500 leading-tight">
            Complete your profile to unlock customized company recommendations.
          </p>
        </div>
      )}
    </aside>
  );
}

export default PlacementReadinessSidebar;
