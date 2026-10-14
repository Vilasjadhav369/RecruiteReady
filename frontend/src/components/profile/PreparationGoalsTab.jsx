import React, { useState, useId, useMemo, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
} from "../ui/index.js";
import {
  PlusIcon,
  CloseIcon,
  AlertCircleIcon,
  FlagIcon,
  CheckIcon,
} from "../ui/Icons.jsx";
import { getGoals } from "../../services/goalService.js";

/**
 * Standardized categorization of suggested placement preparation goals.
 * Structured cleanly: Coding & DSA, Aptitude & Reasoning, Mocks & Interviews, Core CS.
 */
const CATEGORIZED_GOAL_SUGGESTIONS = [
  {
    category: "Coding & DSA",
    items: [
      { text: "Solve 100+ DSA and algorithmic problems", templateKey: "solve_100_dsa" },
      { text: "Master Dynamic Programming and Graphs", templateKey: "master_dp_graphs" },
      { text: "Practice array, string, and matrix patterns", templateKey: "practice_array_patterns" },
      { text: "Achieve proficiency in Trees and Recursion", templateKey: "proficiency_trees_recursion" },
    ],
  },
  {
    category: "Aptitude & Reasoning",
    items: [
      { text: "Achieve 80%+ accuracy in Quantitative Aptitude", templateKey: "aptitude_80_accuracy" },
      { text: "Master Logical Reasoning and Analytical Puzzles", templateKey: "master_logical_reasoning" },
      { text: "Improve Verbal Ability and Reading Comprehension", templateKey: "improve_verbal_ability" },
    ],
  },
  {
    category: "Mock Tests & Speed",
    items: [
      { text: "Complete 5 full-length placement mock tests", templateKey: "complete_5_mocks" },
      { text: "Practice speed solving under strict 60-minute timers", templateKey: "practice_speed_solving" },
      { text: "Benchmark test performance against college cohort", templateKey: "benchmark_test_performance" },
    ],
  },
  {
    category: "Core Computer Science",
    items: [
      { text: "Review Operating Systems and Concurrency concepts", templateKey: "review_os_concurrency" },
      { text: "Master DBMS, SQL queries, and Indexing", templateKey: "master_dbms_sql" },
      { text: "Revise Computer Networks and Web protocols", templateKey: "revise_cn_web" },
    ],
  },
];

const MAX_GOAL_LENGTH = 80;

/**
 * Normalize goal string for duplicate comparison:
 * Trims leading/trailing whitespace and compresses consecutive spaces.
 */
function normalizeGoal(text) {
  if (!text || typeof text !== "string") return "";
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * PreparationGoalsTab — Accessible preparation milestones & goals editor.
 * Follows RecruitReady Design System: Apple + Linear + Premium University.
 *
 * Integrated with P1.6 goal tracking engine:
 * - Shows authoritative live progress indicators and verification badges for active goals.
 * - Displays automated progress vs self-managed status cleanly without oversized cards.
 * - Preserves the standard profile form flow and 8-field completion contract.
 * - Prevents client manipulation of automated metrics (server catalog authoritative).
 */
export default function PreparationGoalsTab({
  preparationGoals = [],
  onAddGoal,
  onRemoveGoal,
  disabled = false,
}) {
  const [newGoalInput, setNewGoalInput] = useState("");
  const [inputError, setInputError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [liveAnnouncement, setLiveAnnouncement] = useState("");

  // Live goals metadata from /api/goals
  const [liveGoalsMap, setLiveGoalsMap] = useState(new Map());

  const inputRef = useRef(null);
  const inputId = useId();
  const errorId = `${inputId}-error`;

  // Fetch live goal documents to show accurate progress alongside goals
  useEffect(() => {
    let isMounted = true;
    async function loadLiveGoalMetadata() {
      try {
        const res = await getGoals();
        if (isMounted && Array.isArray(res?.goals)) {
          const map = new Map();
          res.goals.forEach((g) => {
            map.set(normalizeGoal(g.text), g);
          });
          setLiveGoalsMap(map);
        }
      } catch (e) {
        // Non-blocking: tab continues working seamlessly with string labels
        console.warn("Could not fetch live goal details:", e);
      }
    }
    loadLiveGoalMetadata();
    return () => {
      isMounted = false;
    };
  }, [preparationGoals.length]);

  // Normalized set of currently active goals for duplicate lookup
  const normalizedGoalsSet = useMemo(() => {
    return new Set(preparationGoals.map((g) => normalizeGoal(g)));
  }, [preparationGoals]);

  const isGoalSelected = (goalText) => {
    return normalizedGoalsSet.has(normalizeGoal(goalText));
  };

  // Filtered categorized suggestions
  const filteredSuggestions = useMemo(() => {
    if (selectedCategory === "All") {
      return CATEGORIZED_GOAL_SUGGESTIONS;
    }
    return CATEGORIZED_GOAL_SUGGESTIONS.filter((c) => c.category === selectedCategory);
  }, [selectedCategory]);

  const handleAdd = (rawText) => {
    if (disabled) return;
    setInputError("");

    const candidate = typeof rawText === "string" ? rawText.trim().replace(/\s+/g, " ") : "";

    if (!candidate) {
      setInputError("Please enter a goal or milestone description.");
      if (inputRef.current) inputRef.current.focus();
      return;
    }

    if (candidate.length > MAX_GOAL_LENGTH) {
      setInputError(`Goal must not exceed ${MAX_GOAL_LENGTH} characters (currently ${candidate.length}).`);
      return;
    }

    if (isGoalSelected(candidate)) {
      setInputError(`"${candidate}" is already in your preparation milestones.`);
      setLiveAnnouncement(`"${candidate}" is already in your preparation milestones.`);
      return;
    }

    onAddGoal(candidate);
    setLiveAnnouncement(`Added "${candidate}" to preparation milestones.`);
    setNewGoalInput("");
    setInputError("");

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemove = (goalToRemove) => {
    if (disabled) return;
    onRemoveGoal(goalToRemove);
    setLiveAnnouncement(`Removed "${goalToRemove}" from preparation milestones.`);
    setInputError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      // Prevent parent profile form submission
      e.preventDefault();
      handleAdd(newGoalInput);
    }
  };

  return (
    <Card className="border-slate-200/90 shadow-xs">
      {/* Screen Reader Live Announcement Region */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>

      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <CardTitle>Preparation Milestones</CardTitle>
              <Badge variant="neutral">
                {preparationGoals.length} {preparationGoals.length === 1 ? "Milestone" : "Milestones"}
              </Badge>
            </div>
            <CardDescription>
              Target milestones and topic focus areas guiding your placement preparation.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ================= 1. ACTIVE MILESTONES LIST ================= */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 tracking-tight mb-2">
            Active Preparation Milestones
          </label>

          <div
            className="flex flex-wrap gap-2 min-h-[46px] p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 items-center"
            role="region"
            aria-label="Active preparation milestones list"
          >
            {preparationGoals.map((goal) => {
              const liveMeta = liveGoalsMap.get(normalizeGoal(goal));
              const isVerified = Boolean(liveMeta?.calculatedProgress?.isSatisfied);
              const isSelfReported = Boolean(liveMeta?.manualCompleted) && !isVerified;

              return (
                <span
                  key={goal}
                  className={`inline-flex items-center gap-2 pl-2.5 pr-1.5 py-1.5 rounded-lg border text-xs font-medium shadow-2xs transition-colors group max-w-full ${
                    liveMeta?.isCompleted
                      ? "bg-emerald-50/50 border-emerald-200 text-emerald-900"
                      : "bg-white border-slate-200 text-slate-800 hover:border-slate-300"
                  }`}
                >
                  <FlagIcon className={`w-3.5 h-3.5 shrink-0 ${
                    liveMeta?.isCompleted ? "text-emerald-600" : "text-primary"
                  }`} />
                  <span className="font-medium break-words line-clamp-2">
                    {goal}
                  </span>

                  {/* Verification / Progress Badge */}
                  {isVerified ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                      Verified
                    </span>
                  ) : isSelfReported ? (
                    <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">
                      Self-Reported
                    </span>
                  ) : liveMeta?.calculatedProgress ? (
                    <span className="text-[9px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded shrink-0">
                      {liveMeta.calculatedProgress.percentage}%
                    </span>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => handleRemove(goal)}
                    disabled={disabled}
                    className="min-w-[28px] min-h-[28px] flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer p-0.5 focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50 shrink-0"
                    aria-label={`Remove milestone: ${goal}`}
                    title={`Remove "${goal}"`}
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </span>
              );
            })}

            {preparationGoals.length === 0 && (
              <div className="text-xs text-slate-400 italic py-1 px-1">
                No preparation milestones defined yet. Add custom focus goals or select recommended milestones below.
              </div>
            )}
          </div>
        </div>

        {/* ================= 2. CUSTOM GOAL INPUT ================= */}
        <div className="space-y-1.5 max-w-xl">
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold text-slate-700 tracking-tight"
          >
            Add Custom Milestone
          </label>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                id={inputId}
                type="text"
                value={newGoalInput}
                onChange={(e) => {
                  setNewGoalInput(e.target.value);
                  if (inputError) setInputError("");
                }}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                maxLength={MAX_GOAL_LENGTH + 10}
                placeholder="e.g. Master Graph BFS/DFS, 85%+ in Mock Tests..."
                aria-invalid={Boolean(inputError)}
                aria-describedby={inputError ? errorId : undefined}
                className={`w-full h-10 px-3 text-xs sm:text-sm bg-white border rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all shadow-2xs disabled:bg-slate-50 disabled:cursor-not-allowed ${
                  inputError
                    ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-200 focus:border-primary focus:ring-primary/20"
                }`}
              />

              {/* Character Counter */}
              <span
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono pointer-events-none ${
                  newGoalInput.length > MAX_GOAL_LENGTH
                    ? "text-rose-600 font-bold"
                    : newGoalInput.length >= MAX_GOAL_LENGTH - 15
                    ? "text-amber-600 font-medium"
                    : "text-slate-400"
                }`}
              >
                {newGoalInput.length}/{MAX_GOAL_LENGTH}
              </span>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => handleAdd(newGoalInput)}
              disabled={disabled || !newGoalInput.trim()}
              iconLeft={<PlusIcon className="w-4 h-4" />}
            >
              Add
            </Button>
          </div>

          {inputError && (
            <div
              id={errorId}
              role="alert"
              className="text-xs text-rose-600 flex items-center gap-1.5 pt-0.5"
            >
              <AlertCircleIcon className="w-3.5 h-3.5 shrink-0" />
              <span>{inputError}</span>
            </div>
          )}
        </div>

        {/* ================= 3. CATEGORIZED RECOMMENDATIONS ================= */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Recommended Placement Milestones:
            </span>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1">
              {["All", "Coding & DSA", "Aptitude & Reasoning", "Mock Tests & Speed", "Core Computer Science"].map(
                (cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                      selectedCategory === cat
                        ? "bg-primary text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {cat}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Categorized List */}
          <div className="space-y-3">
            {filteredSuggestions.map((group) => {
              const availableItems = group.items.filter((item) => !isGoalSelected(item.text));
              if (availableItems.length === 0) return null;

              return (
                <div key={group.category} className="space-y-1.5">
                  <span className="text-[11px] font-medium text-slate-500 block">
                    {group.category}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {availableItems.map((suggested) => (
                      <button
                        key={suggested.text}
                        type="button"
                        onClick={() => handleAdd(suggested.text)}
                        disabled={disabled}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-primary-tint hover:text-primary-dark hover:border-primary-border border border-slate-200/80 text-xs font-medium text-slate-600 transition-colors cursor-pointer text-left disabled:opacity-50 disabled:cursor-not-allowed group"
                        title={`Add milestone: ${suggested.text}`}
                      >
                        <PlusIcon className="w-3 h-3 text-slate-400 group-hover:text-primary shrink-0" />
                        <span>{suggested.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
