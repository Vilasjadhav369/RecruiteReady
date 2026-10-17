import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getProgressSummary } from '../services/progressService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  SkeletonCard,
  ErrorState,
  EmptyState,
  ProgressBar,
} from '../components/ui/index.js';
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  ChartBarIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ArrowRightIcon,
  DocumentIcon,
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon,
  CalendarIcon,
  InfoIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  CheckIcon,
} from '../components/ui/Icons.jsx';

/**
 * ScoreTrendChart — Clean SVG Chronological Timeline
 * Renders when >= 2 historical evaluations exist.
 * Uses RecruitReady brand colors (#22C55E for aptitude, #E11D48 for mock tests).
 */
function ScoreTrendChart({ trend = [] }) {
  if (!trend || trend.length < 2) {
    return (
      <div className="p-8 text-center bg-slate-50/70 border border-slate-200/80 rounded-xl">
        <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
          <ChartBarIcon className="w-5 h-5" />
        </div>
        <p className="text-sm font-semibold text-slate-800">
          More activity needed to show performance trends
        </p>
        <span className="text-xs text-slate-500 mt-1 block max-w-md mx-auto leading-relaxed">
          Complete at least 2 evaluated aptitude practice sessions or mock assessments to generate your accuracy timeline.
        </span>
      </div>
    );
  }

  const width = 740;
  const height = 220;
  const paddingX = 45;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  const points = trend.map((item, idx) => {
    const x = paddingX + (idx / (trend.length - 1)) * chartWidth;
    const clampedPct = Math.min(100, Math.max(0, item.percentage || 0));
    const y = paddingY + chartHeight - (clampedPct / 100) * chartHeight;
    return { ...item, x, y, clampedPct };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span className="text-[11px] font-medium text-slate-700">Aptitude Practice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
            <span className="text-[11px] font-medium text-slate-700">Mock Assessment</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {trend.length} Historical {trend.length === 1 ? 'Evaluation' : 'Evaluations'}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[540px] overflow-visible"
        >
          <defs>
            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#166534" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#166534" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((pct) => {
            const y = paddingY + chartHeight - (pct / 100) * chartHeight;
            return (
              <g key={pct}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="var(--color-slate-200, #E2E8F0)"
                  strokeDasharray={pct === 0 || pct === 100 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {points.length > 1 && (
            <polygon
              fill="url(#trendGradient)"
              points={`${points[0].x},${paddingY + chartHeight} ${polylinePoints} ${points[points.length - 1].x},${paddingY + chartHeight}`}
            />
          )}

          {points.length > 1 && (
            <polyline
              pathLength="1"
              className="rr-draw"
              fill="none"
              stroke="var(--color-emerald-600, #059669)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {points.map((p, idx) => {
            const isMock = p.type === 'Mock Test';
            const color = isMock ? '#E11D48' : '#166534';
            return (
              <g key={idx} className="cursor-pointer group">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="#FFFFFF"
                  stroke={color}
                  strokeWidth="2.5"
                  className="transition-transform duration-150 group-hover:scale-125"
                />
                <title>{`${p.label || p.type}: ${p.percentage}% on ${new Date(p.date).toLocaleDateString()}`}</title>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

/**
 * WeeklyActivityChart — 7-Day Trailing Preparation Consistency
 * Validated strictly by real qualifying events.
 */
function WeeklyActivityChart({ weeklyActivity = [], streakDays = 0, longestStreak = 0, prepDays = 0 }) {
  return (
    <Card className="border-slate-200/80 shadow-xs bg-white">
      <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
            <FireIcon className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-base">Preparation Consistency & Activity</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified 7-day activity tracking based strictly on completed sessions and evaluated submissions.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={streakDays > 0 ? 'success' : 'neutral'}>
            {streakDays > 0 ? `${streakDays} Day Streak` : 'No Active Streak'}
          </Badge>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline-block">
            Best: {longestStreak}d
          </span>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="grid grid-cols-7 gap-2 sm:gap-3">
          {weeklyActivity.map((day, idx) => {
            const hasActivity = day.active && day.totalActivities > 0;
            return (
              <div
                key={idx}
                className={`flex flex-col items-center p-2.5 sm:p-3 rounded-xl border transition-all ${
                  day.isToday
                    ? 'ring-2 ring-emerald-500/30 border-emerald-500/50 bg-emerald-50/20'
                    : hasActivity
                    ? 'bg-emerald-50/40 border-emerald-200/70 text-slate-900'
                    : 'bg-slate-50/60 border-slate-200/60 text-slate-400'
                }`}
              >
                <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500">
                  {day.dayOfWeek}
                </span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                  {new Date(day.date).getDate()}
                </span>

                <div className="my-2.5 w-8 h-8 rounded-full flex items-center justify-center font-mono font-bold text-xs transition-transform">
                  {hasActivity ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <CheckIcon className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                      <span className="text-[10px]">0</span>
                    </div>
                  )}
                </div>

                <div className="text-center w-full">
                  <span className="text-[11px] font-medium block truncate text-slate-700">
                    {hasActivity ? `${day.totalActivities} done` : 'Rest'}
                  </span>
                  {hasActivity && (
                    <span className="text-[9px] text-slate-400 block truncate font-mono">
                      {day.aptitudeCount > 0 ? `A:${day.aptitudeCount} ` : ''}
                      {day.codingCount > 0 ? `C:${day.codingCount} ` : ''}
                      {day.mockTestCount > 0 ? `M:${day.mockTestCount}` : ''}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <span>Qualifying Activity (Session/Submission/Exam)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-200 inline-block" />
              <span>No Activity</span>
            </span>
          </div>
          <span className="font-mono text-slate-600">
            Total Active Days: <strong className="text-slate-900">{prepDays}</strong>
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * PlacementReadinessHeroCard — Transparent 100-pt internal indicator
 */
function PlacementReadinessHeroCard({ readiness, onActionClick }) {
  if (!readiness || !readiness.isEligible) {
    return (
      <Card className="border-slate-200/80 shadow-xs bg-white overflow-hidden">
        <div className="p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-semibold">
              <AcademicCapIcon className="w-3.5 h-3.5 text-slate-500" />
              Placement Readiness Evaluation
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Placement Readiness: Not Enough Data
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              {readiness?.message ||
                'Complete at least 1 practice session, coding problem, or mock test to calculate your Placement Readiness score.'}
            </p>
            <div className="flex flex-wrap gap-2 pt-1 justify-center md:justify-start">
              {readiness?.requirementsNeeded?.map((req, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200/80 px-2.5 py-1 rounded-lg"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {req}
                </span>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
            <Button variant="primary" size="sm" onClick={() => onActionClick('/aptitude')}>
              Start Aptitude
            </Button>
            <Button variant="outline" size="sm" onClick={() => onActionClick('/coding')}>
              Solve Coding
            </Button>
            <Button variant="outline" size="sm" onClick={() => onActionClick('/mock-tests')}>
              Take Mock Test
            </Button>
          </div>
        </div>

        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center gap-2 text-xs text-slate-500">
          <InfoIcon className="w-4 h-4 text-slate-400 shrink-0" />
          <span>
            {readiness?.disclaimer ||
              'Placement Readiness is an internal preparation indicator. It does not guarantee job placement.'}
          </span>
        </div>
      </Card>
    );
  }

  const score = readiness.score ?? 0;
  const level = readiness.level || 'Developing';
  const breakdown = readiness.breakdown || {};

  // Badge variant
  const levelVariant =
    score >= 80 ? 'success' : score >= 60 ? 'primary' : score >= 40 ? 'warning' : 'neutral';

  return (
    <Card className="border-slate-200/80 shadow-xs bg-white overflow-hidden">
      <div className="p-6 sm:p-8 space-y-6">
        {/* Top Header Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Preparation Progress Indicator
              </span>
              <Badge variant={levelVariant} dot>
                {level}
              </Badge>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Placement Readiness Score
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              {readiness.message}
            </p>
          </div>

          {/* Main Score Radial / Stat */}
          <div className="flex items-center gap-4 bg-slate-50 border border-slate-200/80 p-4 rounded-xl shrink-0">
            <div className="text-center">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono text-slate-900 tracking-tight">
                {score}
              </span>
              <span className="text-xs font-semibold text-slate-400 block font-mono">/ 100 PTS</span>
            </div>
            <div className="h-10 w-px bg-slate-200" />
            <div className="text-xs text-slate-500 space-y-0.5">
              <div className="font-semibold text-slate-700">{level}</div>
              <div>Deterministic Index</div>
              <div className="text-[10px] text-slate-400 font-mono">Formula: 5 Pillars</div>
            </div>
          </div>
        </div>

        {/* 5-Pillar Score Breakdown */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 block">
            Readiness Components Breakdown
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            {/* 1. Aptitude */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Aptitude</span>
                <span className="font-mono font-bold text-slate-900">
                  {breakdown.aptitude?.score ?? 0} <span className="text-slate-400 font-normal">/ 25</span>
                </span>
              </div>
              <ProgressBar
                value={breakdown.aptitude?.score ?? 0}
                max={25}
                variant="success"
                size="sm"
              />
              <span className="text-[10px] text-slate-500 block leading-tight">
                Accuracy & volume scale
              </span>
            </div>

            {/* 2. Coding */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Coding</span>
                <span className="font-mono font-bold text-slate-900">
                  {breakdown.coding?.score ?? 0} <span className="text-slate-400 font-normal">/ 30</span>
                </span>
              </div>
              <ProgressBar
                value={breakdown.coding?.score ?? 0}
                max={30}
                variant="primary"
                size="sm"
              />
              <span className="text-[10px] text-slate-500 block leading-tight">
                Problems solved & acceptance
              </span>
            </div>

            {/* 3. Mock Tests */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Mock Tests</span>
                <span className="font-mono font-bold text-slate-900">
                  {breakdown.mockTests?.score ?? 0} <span className="text-slate-400 font-normal">/ 25</span>
                </span>
              </div>
              <ProgressBar
                value={breakdown.mockTests?.score ?? 0}
                max={25}
                color="bg-rose-600"
                size="sm"
              />
              <span className="text-[10px] text-slate-500 block leading-tight">
                Exam score & completions
              </span>
            </div>

            {/* 4. Consistency */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Consistency</span>
                <span className="font-mono font-bold text-slate-900">
                  {breakdown.consistency?.score ?? 0} <span className="text-slate-400 font-normal">/ 10</span>
                </span>
              </div>
              <ProgressBar
                value={breakdown.consistency?.score ?? 0}
                max={10}
                variant="warning"
                size="sm"
              />
              <span className="text-[10px] text-slate-500 block leading-tight">
                Active days & calendar streak
              </span>
            </div>

            {/* 5. Profile */}
            <div className="p-3.5 rounded-xl border border-slate-200/80 bg-white space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Profile & Goals</span>
                <span className="font-mono font-bold text-slate-900">
                  {breakdown.profile?.score ?? 0} <span className="text-slate-400 font-normal">/ 10</span>
                </span>
              </div>
              <ProgressBar
                value={breakdown.profile?.score ?? 0}
                max={10}
                variant="navy"
                size="sm"
              />
              <span className="text-[10px] text-slate-500 block leading-tight">
                Academic & target setup
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Transparent Disclaimer Footer */}
      <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {readiness.disclaimer ||
              'Internal progress indicator based on RecruiteReady preparation activity and performance. Does not guarantee placement.'}
          </span>
        </div>
        <span className="font-mono text-[11px] text-slate-400">
          Max: 100 PTS • Verified Formula
        </span>
      </div>
    </Card>
  );
}

/**
 * Main ProgressPage Component
 */
export default function ProgressPage() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sub-tabs
  const [domainTab, setDomainTab] = useState('overview'); // 'overview' | 'aptitude' | 'coding' | 'mockTests'
  const [topicFilter, setTopicFilter] = useState('all'); // 'all' | 'Aptitude' | 'Coding'

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getProgressSummary();
      setData(res);
    } catch (err) {
      console.error('Failed to load student progress:', err);
      setError('Unable to load your preparation progress. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, []);

  const {
    overview,
    aptitude,
    coding,
    mockTests,
    topics = [],
    strengthsAndWeaknesses = {},
    readiness,
    activity,
    companies = [],
    recommendations = [],
    scoreTrend = [],
    recentActivity = [],
  } = data || {};

  const hasAptitudeActivity = (aptitude?.totalAttempts || 0) > 0;
  const hasCodingActivity = (coding?.totalSubmissions || 0) > 0;
  const hasMockTestActivity = (mockTests?.totalAttempts || 0) > 0;
  const hasAnyActivity =
    (overview?.totalActivities || 0) > 0 || hasAptitudeActivity || hasCodingActivity || hasMockTestActivity;

  // Filtered Topic Heatmap
  const filteredTopics = useMemo(() => {
    if (!topics || topics.length === 0) return [];
    if (topicFilter === 'all') return topics;
    return topics.filter((t) => t.domain === topicFilter);
  }, [topics, topicFilter]);

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Your Progress' },
  ];

  const headerActions = (
    <div className="flex items-center gap-2.5 flex-wrap">
      <Button variant="outline" size="sm" onClick={() => navigate('/aptitude')}>
        Practice Aptitude
      </Button>
      <Button variant="outline" size="sm" onClick={() => navigate('/coding')}>
        Solve Coding
      </Button>
      <Button variant="primary" size="sm" onClick={() => navigate('/mock-tests')}>
        Take Mock Test
      </Button>
    </div>
  );

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Your Progress & Analytics"
        description="Factual, verified tracking of your preparation activity, accuracy trends, and assessment performance."
        breadcrumbs={breadcrumbs}
        badge={
          hasAnyActivity ? (
            <Badge variant="success" dot>
              Active Preparation
            </Badge>
          ) : null
        }
        actions={headerActions}
      />

      {/* Main Loading & Error States */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonCard className="h-44" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonCard key={idx} className="h-28" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, idx) => (
              <SkeletonCard key={idx} className="h-64" />
            ))}
          </div>
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorState
            title="Unable to load your progress."
            message={error}
            onRetry={fetchProgress}
          />
        </div>
      ) : !hasAnyActivity ? (
        <div className="space-y-6">
          <PlacementReadinessHeroCard
            readiness={readiness}
            onActionClick={(url) => navigate(url)}
          />
          <EmptyState
            icon={<ChartBarIcon className="w-8 h-8 text-emerald-600" />}
            title="Your preparation starts here."
            description="Complete aptitude practice sessions, coding problems, or mock tests to begin recording authentic preparation analytics."
            action={
              <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                <Button variant="primary" onClick={() => navigate('/aptitude')}>
                  Practice Aptitude
                </Button>
                <Button variant="outline" onClick={() => navigate('/coding')}>
                  Practice Coding
                </Button>
                <Button variant="outline" onClick={() => navigate('/mock-tests')}>
                  Take a Mock Test
                </Button>
              </div>
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {/* 1. Placement Readiness Hero Card */}
          <PlacementReadinessHeroCard
            readiness={readiness}
            onActionClick={(url) => navigate(url)}
          />

          {/* 2. Top Overview KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
            <StatCard
              label="Activities"
              value={overview?.totalActivities || 0}
              subtext="Total completed"
              icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              label="Active Days"
              value={activity?.preparationDays || 0}
              subtext="Calendar days"
              icon={<CalendarIcon className="w-4 h-4 text-slate-700" />}
            />
            <StatCard
              label="Current Streak"
              value={activity?.streakDays || 0}
              subtext={`Best: ${activity?.longestStreak || 0}d`}
              icon={<FireIcon className="w-4 h-4 text-amber-600" />}
            />
            <StatCard
              label="Aptitude Acc."
              value={
                overview?.aptitudeAccuracy !== null && overview?.aptitudeAccuracy !== undefined
                  ? `${overview.aptitudeAccuracy}%`
                  : '—'
              }
              subtext={`${aptitude?.questionsAttempted || 0} questions`}
              icon={<AptitudeIcon className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              label="Solved Code"
              value={coding?.problemsSolved || 0}
              subtext={`${coding?.problemsAttempted || 0} attempted`}
              icon={<CodingIcon className="w-4 h-4 text-slate-800" />}
            />
            <StatCard
              label="Acceptance"
              value={
                overview?.codingSuccessRate !== null && overview?.codingSuccessRate !== undefined
                  ? `${overview.codingSuccessRate}%`
                  : '—'
              }
              subtext={`${coding?.totalSubmissions || 0} submissions`}
              icon={<DocumentIcon className="w-4 h-4 text-slate-600" />}
            />
            <StatCard
              label="Mock Tests"
              value={mockTests?.completed || 0}
              subtext={`${mockTests?.totalAttempts || 0} attempted`}
              icon={<MockTestIcon className="w-4 h-4 text-rose-600" />}
            />
            <StatCard
              label="Mock Avg"
              value={
                overview?.mockTestAverage !== null && overview?.mockTestAverage !== undefined
                  ? `${overview.mockTestAverage}%`
                  : '—'
              }
              subtext={mockTests?.bestPercentage !== null && mockTests?.bestPercentage !== undefined ? `Best: ${mockTests.bestPercentage}%` : 'No score'}
              icon={<TrophyIcon className="w-4 h-4 text-amber-600" />}
            />
          </div>

          {/* 3. Consistency & Weekly Activity */}
          <WeeklyActivityChart
            weeklyActivity={activity?.weeklyActivity || []}
            streakDays={activity?.streakDays || 0}
            longestStreak={activity?.longestStreak || 0}
            prepDays={activity?.preparationDays || 0}
          />

          {/* 4. Domain Tab Switcher */}
          <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setDomainTab('overview')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer ${
                domainTab === 'overview'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              All Domains
            </button>
            <button
              type="button"
              onClick={() => setDomainTab('aptitude')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                domainTab === 'aptitude'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <AptitudeIcon className="w-3.5 h-3.5" />
              Aptitude Practice
            </button>
            <button
              type="button"
              onClick={() => setDomainTab('coding')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                domainTab === 'coding'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <CodingIcon className="w-3.5 h-3.5" />
              Coding Practice
            </button>
            <button
              type="button"
              onClick={() => setDomainTab('mockTests')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                domainTab === 'mockTests'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <MockTestIcon className="w-3.5 h-3.5" />
              Mock Assessments
            </button>
          </div>

          {/* 5. Domain Specific Content or 3-Column Summary Cards */}
          {domainTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Aptitude Card */}
              <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                        <AptitudeIcon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base">Aptitude Practice</CardTitle>
                    </div>
                    {hasAptitudeActivity && aptitude?.accuracy !== null && (
                      <Badge variant="success">{aptitude.accuracy}% Acc</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 space-y-3.5">
                    {hasAptitudeActivity ? (
                      <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Completed Sessions</span>
                          <span className="font-bold text-slate-900 font-mono">{aptitude.completedSessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Questions Attempted</span>
                          <span className="font-bold text-slate-900 font-mono">{aptitude.questionsAttempted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Correct Answers</span>
                          <span className="font-bold text-emerald-600 font-mono">{aptitude.correct}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Incorrect / Unanswered</span>
                          <span className="font-mono text-slate-700">
                            {aptitude.incorrect} / {aptitude.unanswered}
                          </span>
                        </div>
                        <div className="pt-1">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Accuracy Rate</span>
                            <span className="font-mono font-semibold text-slate-700">{aptitude.accuracy || 0}%</span>
                          </div>
                          <ProgressBar value={aptitude.accuracy || 0} max={100} variant="success" size="sm" />
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-xs text-slate-500 mb-3">No aptitude sessions completed yet.</p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/aptitude')}>
                          Start Practice
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>
                {hasAptitudeActivity && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDomainTab('aptitude')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View Details →
                    </button>
                    <Link to="/aptitude/history" className="text-xs text-slate-500 hover:text-slate-800">
                      History
                    </Link>
                  </div>
                )}
              </Card>

              {/* Coding Card */}
              <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                        <CodingIcon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base">Coding Practice</CardTitle>
                    </div>
                    {hasCodingActivity && (
                      <Badge variant="neutral">{coding.problemsSolved} Solved</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 space-y-3.5">
                    {hasCodingActivity ? (
                      <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Unique Problems Solved</span>
                          <span className="font-bold text-emerald-600 font-mono">{coding.problemsSolved}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Problems Attempted</span>
                          <span className="font-bold text-slate-900 font-mono">{coding.problemsAttempted}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Submissions</span>
                          <span className="font-bold text-slate-900 font-mono">{coding.totalSubmissions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Successful / Failed</span>
                          <span className="font-mono text-slate-700">
                            {coding.successfulSubmissions} / {coding.failedSubmissions}
                          </span>
                        </div>
                        <div className="pt-1">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Success Rate</span>
                            <span className="font-mono font-semibold text-slate-700">{coding.successRate || 0}%</span>
                          </div>
                          <ProgressBar value={coding.successRate || 0} max={100} variant="primary" size="sm" />
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-xs text-slate-500 mb-3">No coding submissions recorded yet.</p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/coding')}>
                          Solve Problems
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>
                {hasCodingActivity && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDomainTab('coding')}
                      className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      View Details →
                    </button>
                    <Link to="/coding/history" className="text-xs text-slate-500 hover:text-slate-800">
                      History
                    </Link>
                  </div>
                )}
              </Card>

              {/* Mock Tests Card */}
              <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                        <MockTestIcon className="w-4 h-4" />
                      </div>
                      <CardTitle className="text-base">Mock Assessments</CardTitle>
                    </div>
                    {hasMockTestActivity && mockTests?.averagePercentage !== null && (
                      <Badge variant="danger">{mockTests.averagePercentage}% Avg</Badge>
                    )}
                  </CardHeader>
                  <CardContent className="p-6 space-y-3.5">
                    {hasMockTestActivity ? (
                      <div className="space-y-3 text-xs text-slate-600">
                        <div className="flex justify-between">
                          <span>Completed Assessments</span>
                          <span className="font-bold text-slate-900 font-mono">{mockTests.completed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Exam Attempts</span>
                          <span className="font-bold text-slate-900 font-mono">{mockTests.totalAttempts}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Expired / In Progress</span>
                          <span className="font-mono text-slate-700">
                            {mockTests.expired} / {mockTests.inProgress}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Best Score</span>
                          <span className="font-bold text-rose-600 font-mono">
                            {mockTests.bestPercentage !== null ? `${mockTests.bestPercentage}%` : '—'}
                          </span>
                        </div>
                        <div className="pt-1">
                          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                            <span>Average Score</span>
                            <span className="font-mono font-semibold text-slate-700">
                              {mockTests.averagePercentage || 0}%
                            </span>
                          </div>
                          <ProgressBar
                            value={mockTests.averagePercentage || 0}
                            max={100}
                            color="bg-rose-600"
                            size="sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="py-4 text-center">
                        <p className="text-xs text-slate-500 mb-3">No full mock tests completed yet.</p>
                        <Button variant="outline" size="sm" onClick={() => navigate('/mock-tests')}>
                          Take Mock Test
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </div>
                {hasMockTestActivity && (
                  <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setDomainTab('mockTests')}
                      className="text-xs font-semibold text-rose-700 hover:text-rose-800"
                    >
                      View Details →
                    </button>
                    <Link to="/mock-tests/history" className="text-xs text-slate-500 hover:text-slate-800">
                      History
                    </Link>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Domain Drilldown: Aptitude */}
          {domainTab === 'aptitude' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Questions Breakdown
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Attempted:</span>
                      <span className="font-bold font-mono text-slate-900">{aptitude?.questionsAttempted || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Correct:</span>
                      <span className="font-bold font-mono text-emerald-600">{aptitude?.correct || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700 font-medium">Incorrect:</span>
                      <span className="font-bold font-mono text-red-600">{aptitude?.incorrect || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unanswered:</span>
                      <span className="font-bold font-mono text-slate-600">{aptitude?.unanswered || 0}</span>
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Difficulty Accuracy
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Easy ({aptitude?.byDifficulty?.easy?.attempted || 0} attempted)</span>
                        <span className="font-mono font-semibold">
                          {aptitude?.byDifficulty?.easy?.accuracy !== null
                            ? `${aptitude.byDifficulty.easy.accuracy}%`
                            : '—'}
                        </span>
                      </div>
                      <ProgressBar
                        value={aptitude?.byDifficulty?.easy?.accuracy || 0}
                        max={100}
                        variant="success"
                        size="sm"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Medium ({aptitude?.byDifficulty?.medium?.attempted || 0} attempted)</span>
                        <span className="font-mono font-semibold">
                          {aptitude?.byDifficulty?.medium?.accuracy !== null
                            ? `${aptitude.byDifficulty.medium.accuracy}%`
                            : '—'}
                        </span>
                      </div>
                      <ProgressBar
                        value={aptitude?.byDifficulty?.medium?.accuracy || 0}
                        max={100}
                        variant="warning"
                        size="sm"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Hard ({aptitude?.byDifficulty?.hard?.attempted || 0} attempted)</span>
                        <span className="font-mono font-semibold">
                          {aptitude?.byDifficulty?.hard?.accuracy !== null
                            ? `${aptitude.byDifficulty.hard.accuracy}%`
                            : '—'}
                        </span>
                      </div>
                      <ProgressBar
                        value={aptitude?.byDifficulty?.hard?.accuracy || 0}
                        max={100}
                        variant="danger"
                        size="sm"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Session Aggregate
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Average Session Score:</span>
                      <span className="font-bold font-mono text-slate-900">
                        {aptitude?.averageScore !== null ? `${aptitude.averageScore}%` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Best Session Score:</span>
                      <span className="font-bold font-mono text-emerald-600">
                        {aptitude?.bestScore !== null ? `${aptitude.bestScore}%` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Practice Attempts:</span>
                      <span className="font-bold font-mono text-slate-900">{aptitude?.totalAttempts || 0}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Category Breakdown Table */}
              {aptitude?.byCategory && aptitude.byCategory.length > 0 && (
                <Card className="border-slate-200/80 shadow-xs">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base">Aptitude Performance by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Sessions Completed</TableHead>
                          <TableHead>Questions Attempted</TableHead>
                          <TableHead>Correct</TableHead>
                          <TableHead className="text-right">Accuracy Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aptitude.byCategory.map((cat, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold text-slate-900 capitalize">
                              {cat.category}
                            </TableCell>
                            <TableCell className="font-mono text-slate-700">{cat.completedSessions}</TableCell>
                            <TableCell className="font-mono text-slate-700">{cat.questionsAttempted}</TableCell>
                            <TableCell className="font-bold text-emerald-600 font-mono">{cat.correct}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono font-bold text-emerald-700">
                                {cat.accuracy !== null ? `${cat.accuracy}%` : '—'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Domain Drilldown: Coding */}
          {domainTab === 'coding' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Submission Metrics
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Submissions:</span>
                      <span className="font-bold font-mono text-slate-900">{coding?.totalSubmissions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Accepted:</span>
                      <span className="font-bold font-mono text-emerald-600">
                        {coding?.successfulSubmissions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700 font-medium">Failed / Error:</span>
                      <span className="font-bold font-mono text-red-600">{coding?.failedSubmissions || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Success Rate:</span>
                      <span className="font-bold font-mono text-emerald-700">
                        {coding?.successRate !== null ? `${coding.successRate}%` : '—'}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Difficulty Solved
                  </span>
                  <div className="space-y-2.5 text-xs">
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Easy</span>
                        <span className="font-mono font-semibold">
                          {coding?.difficultyDistribution?.easy?.solved || 0} /{' '}
                          {coding?.difficultyDistribution?.easy?.attempted || 0}
                        </span>
                      </div>
                      <ProgressBar
                        value={coding?.difficultyDistribution?.easy?.solved || 0}
                        max={Math.max(1, coding?.difficultyDistribution?.easy?.attempted || 1)}
                        variant="success"
                        size="sm"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Medium</span>
                        <span className="font-mono font-semibold">
                          {coding?.difficultyDistribution?.medium?.solved || 0} /{' '}
                          {coding?.difficultyDistribution?.medium?.attempted || 0}
                        </span>
                      </div>
                      <ProgressBar
                        value={coding?.difficultyDistribution?.medium?.solved || 0}
                        max={Math.max(1, coding?.difficultyDistribution?.medium?.attempted || 1)}
                        variant="warning"
                        size="sm"
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-slate-600 mb-1">
                        <span>Hard</span>
                        <span className="font-mono font-semibold">
                          {coding?.difficultyDistribution?.hard?.solved || 0} /{' '}
                          {coding?.difficultyDistribution?.hard?.attempted || 0}
                        </span>
                      </div>
                      <ProgressBar
                        value={coding?.difficultyDistribution?.hard?.solved || 0}
                        max={Math.max(1, coding?.difficultyDistribution?.hard?.attempted || 1)}
                        variant="danger"
                        size="sm"
                      />
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Languages Used
                  </span>
                  <div className="space-y-2 text-xs">
                    {coding?.languages && coding.languages.length > 0 ? (
                      coding.languages.map((lang, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="font-mono text-slate-800">{lang.language}</span>
                          <span className="text-slate-500 font-mono">
                            {lang.count} sub ({lang.percentage}%)
                          </span>
                        </div>
                      ))
                    ) : (
                      <span className="text-slate-400">No language data recorded.</span>
                    )}
                  </div>
                </Card>
              </div>

              {/* Coding Topics Table */}
              {coding?.topics && coding.topics.length > 0 && (
                <Card className="border-slate-200/80 shadow-xs">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base">Coding Topics Performance</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Topic Area</TableHead>
                          <TableHead>Problems Attempted</TableHead>
                          <TableHead>Unique Solved</TableHead>
                          <TableHead className="text-right">Pass Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {coding.topics.map((tp, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold text-slate-900">{tp.topic}</TableCell>
                            <TableCell className="font-mono text-slate-700">{tp.attempted}</TableCell>
                            <TableCell className="font-bold text-emerald-600 font-mono">{tp.solved}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono font-bold text-slate-900">
                                {tp.passRate !== null ? `${tp.passRate}%` : '—'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Domain Drilldown: Mock Tests */}
          {domainTab === 'mockTests' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Assessment Status
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Total Attempts:</span>
                      <span className="font-bold font-mono text-slate-900">{mockTests?.totalAttempts || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700 font-medium">Completed / Submitted:</span>
                      <span className="font-bold font-mono text-emerald-600">{mockTests?.completed || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-700 font-medium">Expired / Timed Out:</span>
                      <span className="font-bold font-mono text-amber-600">{mockTests?.expired || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-blue-700 font-medium">In Progress:</span>
                      <span className="font-bold font-mono text-blue-600">{mockTests?.inProgress || 0}</span>
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Score Summary
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Average Score:</span>
                      <span className="font-bold font-mono text-rose-600">
                        {mockTests?.averagePercentage !== null ? `${mockTests.averagePercentage}%` : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Best Exam Score:</span>
                      <span className="font-bold font-mono text-emerald-600">
                        {mockTests?.bestPercentage !== null ? `${mockTests.bestPercentage}%` : '—'}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="border-slate-200/80 p-5 space-y-3">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
                    Take New Exam
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Test your comprehensive preparedness under strict time limits mimicking real company exams.
                  </p>
                  <Button variant="primary" size="sm" onClick={() => navigate('/mock-tests')}>
                    Start Assessment
                  </Button>
                </Card>
              </div>

              {/* Mock Category Breakdown */}
              {mockTests?.byCategory && mockTests.byCategory.length > 0 && (
                <Card className="border-slate-200/80 shadow-xs">
                  <CardHeader className="pb-3 border-b border-slate-100">
                    <CardTitle className="text-base">Mock Assessments by Category</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead>Attempts</TableHead>
                          <TableHead>Completed</TableHead>
                          <TableHead className="text-right">Average Score</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockTests.byCategory.map((cat, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold text-slate-900 capitalize">
                              {cat.category}
                            </TableCell>
                            <TableCell className="font-mono text-slate-700">{cat.totalAttempts}</TableCell>
                            <TableCell className="font-bold text-emerald-600 font-mono">{cat.completed}</TableCell>
                            <TableCell className="text-right">
                              <span className="font-mono font-bold text-rose-600">
                                {cat.averagePercentage !== null ? `${cat.averagePercentage}%` : '—'}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* 6. Topic Performance Heatmap & Status Breakdown */}
          {topics && topics.length > 0 && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">Topic Analysis & Heatmap</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified domain breakdown across Aptitude and Coding with sample-size verified status indicators.
                  </p>
                </div>

                {/* Filter toggle */}
                <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setTopicFilter('all')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      topicFilter === 'all'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Topics ({topics.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicFilter('Aptitude')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      topicFilter === 'Aptitude'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Aptitude
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicFilter('Coding')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      topicFilter === 'Coding'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Coding
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic Area</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Evaluations</TableHead>
                      <TableHead>Correct / Solved</TableHead>
                      <TableHead>Accuracy Rate</TableHead>
                      <TableHead className="text-right">Classification</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTopics.map((item, idx) => {
                      const badgeVariant =
                        item.status === 'strong'
                          ? 'success'
                          : item.status === 'needs_improvement'
                          ? 'danger'
                          : item.status === 'developing'
                          ? 'warning'
                          : 'neutral';

                      return (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-slate-900">{item.topic}</TableCell>
                          <TableCell>
                            <Badge variant={item.domain === 'Aptitude' ? 'primary' : 'neutral'}>
                              {item.domain}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-slate-700">{item.attempts}</TableCell>
                          <TableCell className="font-mono text-emerald-600 font-bold">
                            {item.correct}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-slate-900 w-10">
                                {item.accuracy !== null ? `${item.accuracy}%` : '—'}
                              </span>
                              <div className="w-16 hidden sm:block">
                                <ProgressBar
                                  value={item.accuracy || 0}
                                  max={100}
                                  variant={badgeVariant === 'danger' ? 'danger' : 'success'}
                                  size="sm"
                                />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={badgeVariant}>{item.statusLabel}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>

              <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-medium">Threshold Rules:</span>
                  <span>Strong: ≥70% (min 3 evals)</span>
                  <span>Developing: 60–69%</span>
                  <span>Needs Improvement: &lt;60%</span>
                  <span>&lt;3 evals: More Practice Needed</span>
                </div>
              </div>
            </Card>
          )}

          {/* 7. Strengths & Weak Areas Side-by-Side Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Identified Strengths</CardTitle>
                    <p className="text-xs text-slate-500">≥70% accuracy with at least 3 evaluations</p>
                  </div>
                </div>
                <Badge variant="success">
                  {strengthsAndWeaknesses?.strengths?.length || 0} Topics
                </Badge>
              </CardHeader>

              <CardContent className="p-6">
                {strengthsAndWeaknesses?.strengths && strengthsAndWeaknesses.strengths.length > 0 ? (
                  <div className="space-y-3">
                    {strengthsAndWeaknesses.strengths.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-emerald-100 bg-emerald-50/30 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {item.topic}
                            </span>
                            <Badge variant="neutral">{item.domain}</Badge>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                            {item.correct} of {item.attempts} correct ({item.attempts} evaluations)
                          </span>
                        </div>
                        <span className="text-sm font-bold font-mono text-emerald-700">
                          {item.accuracy}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">No established strengths yet</p>
                    <p>
                      {strengthsAndWeaknesses?.hasEnoughData
                        ? 'Practice more topics to reach ≥70% accuracy across at least 3 evaluations.'
                        : 'Requires at least 3 evaluations per topic to verify strong proficiency.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Weak Areas Card */}
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center shrink-0">
                    <AlertTriangleIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <CardTitle className="text-base">Focus & Improvement Areas</CardTitle>
                    <p className="text-xs text-slate-500">&lt;60% accuracy with at least 3 evaluations</p>
                  </div>
                </div>
                <Badge variant={strengthsAndWeaknesses?.weakAreas?.length > 0 ? 'danger' : 'neutral'}>
                  {strengthsAndWeaknesses?.weakAreas?.length || 0} Topics
                </Badge>
              </CardHeader>

              <CardContent className="p-6">
                {strengthsAndWeaknesses?.weakAreas && strengthsAndWeaknesses.weakAreas.length > 0 ? (
                  <div className="space-y-3">
                    {strengthsAndWeaknesses.weakAreas.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg border border-rose-100 bg-rose-50/30 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 text-xs sm:text-sm">
                              {item.topic}
                            </span>
                            <Badge variant="neutral">{item.domain}</Badge>
                          </div>
                          <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                            {item.correct} of {item.attempts} correct ({item.attempts} evaluations)
                          </span>
                        </div>
                        <span className="text-sm font-bold font-mono text-rose-700">
                          {item.accuracy}%
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">No low-accuracy weak areas detected</p>
                    <p>
                      {strengthsAndWeaknesses?.hasEnoughData
                        ? 'Great work! All your evaluated topics have maintained at least 60% accuracy.'
                        : 'Topics require at least 3 evaluations before being categorized as weak areas.'}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 8. Target Company Preparation Tracking */}
          {companies && companies.length > 0 && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">Target Company Preparation</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Verified preparation checklist tracking your actual activity against target company syllabi.
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => navigate('/companies')}>
                  Browse All Companies →
                </Button>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {companies.map((comp) => (
                    <div
                      key={comp.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white hover:border-slate-300 transition-all flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            {comp.logo ? (
                              <img
                                src={comp.logo}
                                alt={comp.name}
                                className="w-8 h-8 rounded-lg object-contain bg-slate-50 p-1 border border-slate-100"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-xs border border-emerald-100">
                                {comp.name.charAt(0)}
                              </div>
                            )}
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{comp.name}</h4>
                              <span className="text-[11px] text-slate-500 block truncate max-w-[140px]">
                                {comp.roles?.join(', ') || 'Target Company'}
                              </span>
                            </div>
                          </div>
                          {comp.hasBookmarks && (
                            <Badge variant="primary">Saved</Badge>
                          )}
                        </div>

                        {/* Verified Checklist */}
                        <div className="mt-3.5 space-y-2 border-t border-slate-100 pt-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Verified Preparation Status
                          </span>
                          <div className="space-y-1.5 text-xs">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Aptitude Topics Practiced:</span>
                              <span className="font-mono font-semibold text-slate-900">
                                {comp.topicsPrepared}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Coding Problems Solved:</span>
                              <span className="font-mono font-semibold text-slate-900">
                                {comp.codingSolved}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600">Mock Tests Completed:</span>
                              <span className="font-mono font-semibold text-slate-900">
                                {comp.mockTestsTaken}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <Link
                          to={`/companies/${comp.slug || comp.id}`}
                          className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                        >
                          View Company Prep →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 9. Prioritized Deterministic Recommendations */}
          {recommendations && recommendations.length > 0 && (
            <Card className="border-slate-200/80 shadow-xs bg-slate-50/50">
              <CardHeader className="pb-3 border-b border-slate-200/60 flex flex-row items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-emerald-700" />
                <div>
                  <CardTitle className="text-base">Targeted Recommendations</CardTitle>
                  <p className="text-xs text-slate-500">
                    Rule-based next steps prioritized by your actual performance and weak spots.
                  </p>
                </div>
              </CardHeader>

              <CardContent className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-4 rounded-xl border border-slate-200/80 bg-white flex flex-col justify-between space-y-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            {rec.domain}
                          </span>
                          <Badge variant={rec.priority === 1 ? 'warning' : 'neutral'}>
                            Priority {rec.priority}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-slate-900 text-sm">{rec.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{rec.description}</p>
                      </div>

                      <div className="pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          iconRight={<ArrowRightIcon className="w-3 h-3" />}
                          onClick={() => navigate(rec.actionUrl)}
                          className="w-full text-xs"
                        >
                          {rec.actionLabel}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 10. Historical Evaluation Timeline */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">Historical Accuracy Timeline</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Chronological record of scores across completed aptitude sessions and submitted mock exams.
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono">Performance Timeline</span>
            </CardHeader>
            <CardContent className="p-6">
              <ScoreTrendChart trend={scoreTrend} />
            </CardContent>
          </Card>

          {/* 11. Unified Recent Activity Feed */}
          {recentActivity && recentActivity.length > 0 && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Recent Preparation Activity</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified stream of your latest attempts, assessments, and code submissions.
                  </p>
                </div>
                <ClockIcon className="w-4 h-4 text-slate-400" />
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {recentActivity.map((act) => {
                  const isAptitude = act.type === 'aptitude';
                  const isCoding = act.type === 'coding';

                  const iconEl = isAptitude ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center justify-center shrink-0">
                      <AptitudeIcon className="w-4 h-4" />
                    </div>
                  ) : isCoding ? (
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                      <CodingIcon className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                      <MockTestIcon className="w-4 h-4" />
                    </div>
                  );

                  const statusBadgeVariant =
                    act.status === 'submitted' || act.status === 'accepted'
                      ? 'success'
                      : act.status === 'wrong_answer'
                      ? 'danger'
                      : act.status === 'expired'
                      ? 'warning'
                      : 'neutral';

                  return (
                    <div
                      key={act.id}
                      className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {iconEl}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">{act.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{act.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={statusBadgeVariant}>
                          {act.status ? act.status.replace(/_/g, ' ') : 'recorded'}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                          {act.timestamp
                            ? new Date(act.timestamp).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
