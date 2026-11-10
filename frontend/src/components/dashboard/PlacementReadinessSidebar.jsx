import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  CompanyIcon,
  ArrowRightIcon,
  CheckIcon,
} from "../ui/Icons.jsx";
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
 * PlacementReadinessSidebar — Compact Placement Readiness Card with embedded tabs.
 * Single-line readiness title, neutral status badge without truncation, and embedded [Focus areas / Targets / Goals] tabs.
 */
export function PlacementReadinessSidebar({
  readiness = null,
  weakAreas = null,
  targetCompanies = [],
  preparationGoals = [],
}) {
  const hasReadiness = readiness?.score !== null && readiness?.status !== "insufficient_data";
  const score = readiness?.score ?? 0;
  const breakdown = readiness?.breakdown;

  const weakItems = weakAreas?.items || [];
  const companies = Array.isArray(targetCompanies) ? targetCompanies : [];

  // Goal API state
  const [tab, setTab] = useState("focus"); // 'focus' | 'targets' | 'goals'
  const [goalsData, setGoalsData] = useState([]);
  const [loadingGoals, setLoadingGoals] = useState(true);
  const [, setTogglingGoalId] = useState(null);
  const [, setToggleError] = useState(null);

  const fetchGoals = useCallback(async () => {
    setLoadingGoals(true);
    setToggleError(null);
    try {
      const res = await getGoals();
      if (res.success && Array.isArray(res.data?.goals)) {
        setGoalsData(res.data.goals);
      }
    } catch (err) {
      console.warn("Goals load fallback in readiness sidebar:", err);
    } finally {
      setLoadingGoals(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleToggle = async (goal) => {
    if (!goal?._id) return;
    setTogglingGoalId(goal._id);
    setToggleError(null);
    try {
      const nextCompleted = !goal.isCompleted;
      const res = await toggleGoal(goal._id, nextCompleted);
      if (res.success && res.data) {
        setGoalsData((prev) =>
          prev.map((g) => (g._id === goal._id ? { ...g, isCompleted: nextCompleted } : g))
        );
      }
    } catch (err) {
      console.error("Failed to toggle goal state:", err);
      const msg = err.response?.data?.message || "Failed to update goal completion status.";
      setToggleError(msg);
    } finally {
      setTogglingGoalId(null);
    }
  };

  const getStatusBadgeText = (status) => {
    switch (status) {
      case "placement_ready":
        return "Placement Ready";
      case "progressing":
        return "Progressing";
      default:
        return "Building";
    }
  };

  const statusBadgeText = getStatusBadgeText(readiness?.status);

  const fallbackGoals = Array.isArray(preparationGoals)
    ? preparationGoals.filter((g) => typeof g === "string" && g.trim().length > 0)
    : [];

  return (
    <aside aria-label="Placement intelligence summary" className="h-full flex flex-col">
      {/* 1. Placement Readiness Card with Embedded Tabs */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3 h-full flex flex-col justify-between">
        <div className="space-y-3">
          {/* Header: Single-line Title */}
          <div className="flex items-center justify-between gap-2 min-w-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-ink-2 truncate m-0">
              Placement Readiness Index
            </h2>
            <Link
              to="/progress"
              className="text-xs font-semibold text-primary hover:underline no-underline shrink-0 flex items-center gap-1"
            >
              Details <ArrowRightIcon className="w-3 h-3" />
            </Link>
          </div>

          {/* Score & Status Badge (Un-truncated, neutral badge) */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-extrabold text-ink font-mono tracking-tight leading-none">
                {hasReadiness ? score : "—"}
              </span>
              <span className="text-xs text-ink-2 font-medium">/ 100</span>
            </div>

            <span
              className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-border bg-primary-soft text-ink-2 shrink-0 whitespace-nowrap"
              title="Building Foundations"
            >
              {statusBadgeText}
            </span>
          </div>

          {/* Breakdown List */}
          {hasReadiness && breakdown ? (
            <div className="space-y-1.5 pt-2 border-t border-border text-xs text-ink-2">
              {isCodingEnabled() && (
              <div className="flex items-center justify-between">
                <span>Coding Mastery</span>
                <span className="font-mono font-semibold text-ink">{breakdown.codingScore}/30</span>
              </div>
              )}
              <div className="flex items-center justify-between">
                <span>Aptitude Accuracy</span>
                <span className="font-mono font-semibold text-ink">{breakdown.aptitudeScore}/30</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Timed Mocks</span>
                <span className="font-mono font-semibold text-ink">{breakdown.mockTestScore}/25</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Profile completeness</span>
                <span className="font-mono font-semibold text-ink">{breakdown.profileScore}/15</span>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-ink-2 leading-relaxed pt-1.5 border-t border-border m-0">
              Solve questions and complete mock assessments to generate your verified placement readiness index.
            </p>
          )}
        </div>

        {/* Embedded Tabs: Focus areas / Targets / Goals */}
        <div className="pt-2 border-t border-border space-y-2.5 flex-1 flex flex-col justify-between">
          {/* Tab Switcher Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-primary-soft rounded-lg">
            {[
              { key: "focus", label: "Focus areas" },
              { key: "targets", label: `Targets (${companies.length})` },
              { key: "goals", label: "Goals" },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={tab === key}
                onClick={() => setTab(key)}
                className={`flex-1 px-2 py-1 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                  tab === key
                    ? "bg-card text-ink border border-border shadow-2xs font-bold"
                    : "text-ink-2 hover:text-ink border border-transparent"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab 1: Focus Areas */}
          {tab === "focus" && (
            <div className="space-y-2">
              {weakItems.length > 0 ? (
                weakItems.slice(0, 2).map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-lg bg-primary-soft border border-border flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-ink truncate block">
                        {item.name}
                      </span>
                      <span className="text-[11px] font-semibold text-warning block mt-0.5">
                        {item.metric}
                      </span>
                    </div>

                    <Link
                      to={item.actionLink || "/aptitude"}
                      className="px-2 py-0.5 text-[11px] font-semibold text-ink bg-card border border-border hover:bg-primary-soft rounded transition-colors shrink-0 no-underline"
                    >
                      {item.actionText || "Practice"}
                    </Link>
                  </div>
                ))
              ) : (
                <p className="text-[11px] text-ink-2 m-0 py-1">
                  {hasReadiness
                    ? "All evaluated skill domains meet benchmark performance."
                    : "Complete an assessment to populate focus areas."}
                </p>
              )}
            </div>
          )}

          {/* Tab 2: Targets */}
          {tab === "targets" && (
            <div className="space-y-2">
              {companies.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {companies.slice(0, 5).map((comp, idx) => {
                    const cName = typeof comp === "string" ? comp : comp?.name || "Company";
                    return (
                      <Link
                        key={idx}
                        to="/companies"
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary-soft border border-border text-ink hover:border-border/80 text-xs font-medium no-underline transition-colors"
                      >
                        <CompanyIcon className="w-3 h-3 text-ink-2 shrink-0" />
                        <span className="truncate">{cName}</span>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-2 space-y-1">
                  <p className="text-[11px] text-ink-2 m-0">No target companies selected yet.</p>
                  <Link to="/companies" className="text-xs font-semibold text-primary hover:underline inline-block no-underline">
                    Explore company tracks →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Goals */}
          {tab === "goals" && (
            <div className="space-y-2">
              {loadingGoals ? (
                <p className="text-[11px] text-ink-2 m-0 py-1">Loading goal milestones…</p>
              ) : goalsData.length > 0 ? (
                <div className="space-y-1.5">
                  {goalsData.slice(0, 3).map((goal) => (
                    <div
                      key={goal._id}
                      onClick={() => handleToggle(goal)}
                      className={`p-2 rounded-lg border flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        goal.isCompleted
                          ? "bg-primary-soft border-border text-ink-2"
                          : "bg-card border-border hover:bg-primary-soft text-ink"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                            goal.isCompleted
                              ? "bg-primary text-surface border-primary"
                              : "border-border bg-card"
                          }`}
                        >
                          {goal.isCompleted && <CheckIcon className="w-3 h-3" />}
                        </div>
                        <span className={`text-xs truncate ${goal.isCompleted ? "line-through text-ink-2" : "font-medium"}`}>
                          {goal.title || formatLegacyGoalLabel(goal.targetKey)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : fallbackGoals.length > 0 ? (
                <div className="space-y-1.5">
                  {fallbackGoals.slice(0, 3).map((g, idx) => (
                    <div key={idx} className="p-2 rounded-lg bg-primary-soft border border-border text-xs text-ink">
                      {formatLegacyGoalLabel(g)}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-2 space-y-1">
                  <p className="text-[11px] text-ink-2 m-0">No preparation goals configured.</p>
                  <Link to="/profile#preparation-goals-section" className="text-xs font-semibold text-primary hover:underline inline-block no-underline">
                    Set preparation goals →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

export default PlacementReadinessSidebar;
