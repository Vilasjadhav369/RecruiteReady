import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAdminAnalytics } from '../../services/adminService.js';
import AdminStatCard from '../../components/admin/AdminStatCard.jsx';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  ErrorState,
} from '../../components/ui/index.js';
import {
  ProfileIcon,
  AptitudeIcon,
  CodingIcon,
  CompanyIcon,
  ResourcesIcon,
  MockTestIcon,
  StarIcon,
  RefreshIcon,
  ChartBarIcon,
  InfoIcon,
  ArrowRightIcon,
} from '../../components/ui/Icons.jsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Safely parses any metric value to prevent NaN, null, or undefined displays.
 * Handles nested objects, numeric strings, and raw numbers.
 */
function safeNumber(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (typeof val === 'object') {
    const extracted =
      val.total ??
      val.count ??
      val.questions ??
      val.problems ??
      val.active ??
      val.submissions ??
      val.attempts;
    if (typeof extracted === 'number' && !isNaN(extracted)) return extracted;
    const parsed = Number(extracted);
    return isNaN(parsed) ? fallback : parsed;
  }
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Formats YYYY-MM-DD string to a readable "MMM D" label for charts.
 */
function formatChartDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return '—';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    }
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

// ─── SVG Chart: Activity Volume Trend ─────────────────────────────────────────

function ActivityVolumeChart({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        <ChartBarIcon className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-700">No Assessment Activity Yet</p>
        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
          Daily aptitude and mock assessment attempt volumes will plot here automatically as students practice.
        </p>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padding = { top: 25, right: 20, bottom: 40, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxAttempts = Math.max(...data.map((d) => safeNumber(d.attempts)), 4);
  const yTicks = [0, Math.ceil(maxAttempts / 2), maxAttempts];

  // Compute points
  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (i * chartWidth) / (data.length - 1);
    const yVal = safeNumber(d.attempts);
    const y = padding.top + chartHeight - (yVal / maxAttempts) * chartHeight;
    return { x, y, val: yVal, date: d.date };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // SVG Area path
  const areaPath =
    points.length > 1
      ? `${points[0].x},${padding.top + chartHeight} ` +
        polylinePoints +
        ` ${points[points.length - 1].x},${padding.top + chartHeight}`
      : '';

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[500px] overflow-visible"
        aria-label="Daily Assessment Attempts Chart"
      >
        {/* Horizontal gridlines */}
        {yTicks.map((tickVal, idx) => {
          const y = padding.top + chartHeight - (tickVal / maxAttempts) * chartHeight;
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray={idx === 0 ? 'none' : '3 3'}
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {tickVal}
              </text>
            </g>
          );
        })}

        {/* Shaded Area */}
        {areaPath && (
          <polygon
            points={areaPath}
            fill="var(--color-primary-soft)"
            opacity="0.9"
          />
        )}

        {/* Line */}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="var(--color-primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}

        {/* Data Circles */}
        {points.map((p, idx) => (
          <g key={idx} className="cursor-pointer group">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#FFFFFF"
              stroke="var(--color-primary)"
              strokeWidth="2.5"
              className="transition-transform group-hover:scale-150"
            />
            <title>{`${p.val} attempts on ${formatChartDate(p.date)}`}</title>
          </g>
        ))}

        {/* X Axis Labels */}
        {points.map((p, idx) => {
          // If many points, display alternate labels to prevent overlap
          const showLabel =
            data.length <= 7 || idx % 2 === 0 || idx === data.length - 1;
          if (!showLabel) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              className="text-[10px] fill-slate-500 font-medium"
            >
              {formatChartDate(p.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── SVG Chart: Average Score Performance ────────────────────────────────────

function AverageScoreChart({ data = [] }) {
  if (!Array.isArray(data) || data.length === 0) {
    return (
      <div className="h-56 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 rounded-lg border border-dashed border-slate-200">
        <ChartBarIcon className="w-8 h-8 text-slate-300 mb-2" />
        <p className="text-xs font-semibold text-slate-700">No Score Performance Data Yet</p>
        <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
          Student average test percentage scores will plot as assessments are submitted.
        </p>
      </div>
    );
  }

  const width = 640;
  const height = 220;
  const padding = { top: 25, right: 20, bottom: 40, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const yTicks = [0, 25, 50, 75, 100];

  const points = data.map((d, i) => {
    const x =
      data.length === 1
        ? padding.left + chartWidth / 2
        : padding.left + (i * chartWidth) / (data.length - 1);
    const scoreVal = Math.min(100, Math.max(0, safeNumber(d.avgScore)));
    const y = padding.top + chartHeight - (scoreVal / 100) * chartHeight;
    return { x, y, val: scoreVal, date: d.date };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto min-w-[500px] overflow-visible"
        aria-label="Average Score Percentage Chart"
      >
        {/* Horizontal gridlines at 0%, 25%, 50%, 75%, 100% */}
        {yTicks.map((pct) => {
          const y = padding.top + chartHeight - (pct / 100) * chartHeight;
          return (
            <g key={pct}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray={pct === 0 || pct === 100 ? 'none' : '3 3'}
                strokeWidth="1"
              />
              <text
                x={padding.left - 10}
                y={y + 3.5}
                textAnchor="end"
                className="text-[10px] fill-slate-400 font-mono"
              >
                {pct}%
              </text>
            </g>
          );
        })}

        {/* Target 60% Benchmark line (University placement threshold) */}
        <line
          x1={padding.left}
          y1={padding.top + chartHeight - (60 / 100) * chartHeight}
          x2={width - padding.right}
          y2={padding.top + chartHeight - (60 / 100) * chartHeight}
          stroke="#16A34A"
          strokeDasharray="4 4"
          strokeWidth="1.25"
          opacity="0.6"
        />

        {/* Connective Line */}
        {points.length > 1 && (
          <polyline
            fill="none"
            stroke="#16A34A"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}

        {/* Data Circles */}
        {points.map((p, idx) => (
          <g key={idx} className="cursor-pointer group">
            <circle
              cx={p.x}
              cy={p.y}
              r="4.5"
              fill="#FFFFFF"
              stroke="#16A34A"
              strokeWidth="2.5"
              className="transition-transform group-hover:scale-150"
            />
            <title>{`${p.val}% average score on ${formatChartDate(p.date)}`}</title>
          </g>
        ))}

        {/* X Axis Labels */}
        {points.map((p, idx) => {
          const showLabel =
            data.length <= 7 || idx % 2 === 0 || idx === data.length - 1;
          if (!showLabel) return null;
          return (
            <text
              key={idx}
              x={p.x}
              y={height - 12}
              textAnchor="middle"
              className="text-[10px] fill-slate-500 font-medium"
            >
              {formatChartDate(p.date)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAdminAnalytics();
      setData(result || null);
    } catch (err) {
      console.error('Fetch analytics error:', err);
      setError(
        err.response?.data?.message ||
          'Failed to aggregate live platform analytics from backend services.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Extract metrics safely to prevent NaN and null crashes
  const metrics = data?.metrics || data || {};
  const studentsTotal = safeNumber(metrics.students?.total ?? metrics.totalStudents);
  const studentsActive = safeNumber(metrics.students?.active);
  const studentsInactive = Math.max(0, studentsTotal - studentsActive);

  const aptQuestions = safeNumber(metrics.aptitude?.questions ?? metrics.aptitudeQuestions);
  const aptAttempts = safeNumber(metrics.aptitude?.attempts);

  const codingProblems = safeNumber(metrics.coding?.problems ?? metrics.totalCodingProblems);
  const codingSubmissions = safeNumber(metrics.coding?.submissions);

  const mockTestsTotal = safeNumber(metrics.mockTests?.total ?? metrics.totalMockTests);
  const mockAttempts = safeNumber(metrics.mockTests?.attempts);

  const companiesTotal = safeNumber(metrics.companies?.total ?? metrics.totalCompanies);
  const resourcesTotal = safeNumber(metrics.resources?.total ?? metrics.totalResources);

  const reviewsTotal = safeNumber(metrics.reviews?.total);
  const reviewsApproved = safeNumber(metrics.reviews?.approved);
  const reviewsPending = safeNumber(metrics.reviews?.pending);
  const reviewsRejected = Math.max(0, reviewsTotal - reviewsApproved - reviewsPending);

  // Real historical trend array directly from MongoDB aggregation
  const activityTrend = useMemo(
    () => (Array.isArray(data?.activityTrend) ? data.activityTrend : []),
    [data]
  );

  // Total student practice volume across all 3 modules
  const totalPracticeEngagements = aptAttempts + codingSubmissions + mockAttempts;

  // Average score across recorded trend days
  const overallAvgScore = useMemo(() => {
    if (activityTrend.length === 0) return 0;
    const sum = activityTrend.reduce((acc, curr) => acc + safeNumber(curr.avgScore), 0);
    return Math.round(sum / activityTrend.length);
  }, [activityTrend]);

  // Total attempts during trend window
  const trendTotalAttempts = useMemo(() => {
    return activityTrend.reduce((acc, curr) => acc + safeNumber(curr.attempts), 0);
  }, [activityTrend]);

  // ─── ERROR STATE ────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6 pb-16">
        <PageHeader
          title="Platform Analytics"
          description="Real-time aggregated performance metrics and preparation volume across all modules."
          breadcrumbs={[{ label: 'Admin Console' }, { label: 'Analytics' }]}
        />
        <ErrorState
          title="Unable to Load Platform Analytics"
          message={error}
          onRetry={fetchAnalytics}
        />
      </div>
    );
  }

  // ─── LOADING STATE ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="space-y-2 border-b border-slate-200/80 pb-4">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* Metric cards skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <AdminStatCard key={i} title="Metric" loading={true} />
          ))}
        </div>

        {/* Secondary metrics skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <AdminStatCard key={i} title="Catalog" loading={true} />
          ))}
        </div>

        {/* Charts skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-52 w-full rounded-lg" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-52 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ─── RENDER MAIN VIEW ───────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. Page Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Platform Analytics"
        description="Real-time aggregated performance metrics and preparation volume across all modules."
        breadcrumbs={[{ label: 'Admin Console' }, { label: 'Analytics' }]}
        actions={
          <div className="flex items-center gap-2">
            <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Database</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAnalytics}
              iconLeft={<RefreshIcon className="w-3.5 h-3.5" />}
            >
              Refresh Data
            </Button>
          </div>
        }
      />

      {/* ── 2. Primary Assessment & Student Metrics ──────────────────── */}
      <div>
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
          Core Engagement & Student Activity
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard
            title="Registered Students"
            value={studentsTotal}
            subtitle={`${studentsActive} active accounts (${studentsInactive} inactive)`}
            icon={ProfileIcon}
          />
          <AdminStatCard
            title="Aptitude Attempts"
            value={aptAttempts}
            subtitle={`${aptQuestions} questions in bank`}
            icon={AptitudeIcon}
          />
          <AdminStatCard
            title="Coding Submissions"
            value={codingSubmissions}
            subtitle={`${codingProblems} algorithm challenges`}
            icon={CodingIcon}
          />
          <AdminStatCard
            title="Mock Test Attempts"
            value={mockAttempts}
            subtitle={`${mockTestsTotal} assessments published`}
            icon={MockTestIcon}
          />
        </div>
      </div>

      {/* ── 3. Content Catalog & Review Stats ───────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <AdminStatCard
          title="Company Preparation Tracks"
          value={companiesTotal}
          subtitle="Enterprise placement patterns"
          icon={CompanyIcon}
        />
        <AdminStatCard
          title="Study Materials"
          value={resourcesTotal}
          subtitle="Curated notes, roadmaps, and cheat sheets"
          icon={ResourcesIcon}
        />
        <AdminStatCard
          title="Student Reviews"
          value={reviewsTotal}
          subtitle={`${reviewsApproved} approved • ${reviewsPending} pending moderation`}
          icon={StarIcon}
        />
      </div>

      {/* ── 4. Trend Visualizations ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Trend 1: Daily Activity Volume */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Daily Assessment Activity
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Volume of completed aptitude assessments per day (last 14 active days).
                </CardDescription>
              </div>
              {activityTrend.length > 0 && (
                <Badge variant="primary" size="sm">
                  {trendTotalAttempts} Total Attempts
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <ActivityVolumeChart data={activityTrend} />
          </CardContent>
        </Card>

        {/* Trend 2: Average Score Performance (%) */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  Average Score Performance
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Daily average assessment percentage score (green dashed line = 60% placement benchmark).
                </CardDescription>
              </div>
              {activityTrend.length > 0 && (
                <Badge
                  variant={overallAvgScore >= 60 ? 'success' : 'warning'}
                  size="sm"
                >
                  {overallAvgScore}% Mean Score
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <AverageScoreChart data={activityTrend} />
          </CardContent>
        </Card>
      </div>

      {/* ── 5. Engagement Breakdown & Moderation Pipeline ────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Activity Distribution by Module */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Activity Distribution Across Modules
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Proportion of total student engagement ({totalPracticeEngagements.toLocaleString()} total interactions)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-4">
              {[
                {
                  label: 'Aptitude Practice Attempts',
                  value: aptAttempts,
                  color: 'bg-primary',
                  icon: AptitudeIcon,
                },
                {
                  label: 'Coding Submissions',
                  value: codingSubmissions,
                  color: 'bg-indigo-600',
                  icon: CodingIcon,
                },
                {
                  label: 'Full Mock Test Attempts',
                  value: mockAttempts,
                  color: 'bg-amber-600',
                  icon: MockTestIcon,
                },
              ].map((row) => {
                const pct =
                  totalPracticeEngagements > 0
                    ? Math.round((row.value / totalPracticeEngagements) * 100)
                    : 0;
                const Icon = row.icon;
                return (
                  <div key={row.label} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="font-semibold text-slate-800">{row.label}</span>
                      </div>
                      <div className="flex items-center gap-2 font-mono">
                        <span className="font-bold text-slate-900">
                          {row.value.toLocaleString()}
                        </span>
                        <span className="text-slate-400">({pct}%)</span>
                      </div>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${row.color} transition-all duration-300`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}

              {totalPracticeEngagements === 0 && (
                <p className="text-xs text-slate-400 text-center py-2 italic">
                  No student interaction data recorded yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Reviews Moderation Pipeline Card */}
        <div className="lg:col-span-5">
          <Card>
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900">
                    Review Moderation Pipeline
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500 mt-0.5">
                    Status of student-submitted platform feedback
                  </CardDescription>
                </div>
                <Button to="/admin/reviews" variant="ghost" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
                    Moderate
                  </Button>
              </div>
            </CardHeader>
            <CardContent className="p-5 space-y-3">
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3 bg-amber-50/80 border border-amber-200/60 rounded-xl">
                  <span className="text-xl font-bold font-mono text-amber-800 block">
                    {reviewsPending}
                  </span>
                  <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider mt-1 block">
                    Pending
                  </span>
                </div>
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/60 rounded-xl">
                  <span className="text-xl font-bold font-mono text-emerald-800 block">
                    {reviewsApproved}
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mt-1 block">
                    Approved
                  </span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl">
                  <span className="text-xl font-bold font-mono text-slate-700 block">
                    {reviewsRejected}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-1 block">
                    Rejected
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-200/60">
                <span className="font-semibold text-slate-700">Moderation policy: </span>
                Only student reviews marked as <strong className="text-emerald-700">Approved</strong> are exposed publicly on the student feedback page.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── 6. Platform Content Catalog Overview ─────────────────────── */}
      <Card>
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-slate-900">
            Platform Content & Activity Summary
          </CardTitle>
          <CardDescription className="text-xs text-slate-500 mt-0.5">
            Overview of learning materials and student practice across all academic sections.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Learning Module</TableHead>
                  <TableHead>Catalog Items</TableHead>
                  <TableHead>Student Engagements</TableHead>
                  <TableHead>Quick Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <AptitudeIcon className="w-4 h-4 text-primary" />
                      <span>Quantitative & Logical Aptitude</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {aptQuestions} questions
                  </TableCell>
                  <TableCell className="text-xs text-slate-900 font-mono font-medium">
                    {aptAttempts.toLocaleString()} completed attempts
                  </TableCell>
                  <TableCell>
                    <Link to="/admin/aptitude" className="text-xs text-primary hover:text-primary-dark font-semibold hover:underline">
                      Manage Aptitude →
                    </Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <CodingIcon className="w-4 h-4 text-emerald-600" />
                      <span>Coding & Algorithmic Practice</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {codingProblems} problems
                  </TableCell>
                  <TableCell className="text-xs text-slate-900 font-mono font-medium">
                    {codingSubmissions.toLocaleString()} submissions
                  </TableCell>
                  <TableCell>
                    <Link to="/admin/coding" className="text-xs text-primary hover:text-primary-dark font-semibold hover:underline">
                      Manage Coding →
                    </Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <MockTestIcon className="w-4 h-4 text-amber-600" />
                      <span>Placement Mock Assessments</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {mockTestsTotal} assessments
                  </TableCell>
                  <TableCell className="text-xs text-slate-900 font-mono font-medium">
                    {mockAttempts.toLocaleString()} attempts
                  </TableCell>
                  <TableCell>
                    <Link to="/admin/mock-tests" className="text-xs text-primary hover:text-primary-dark font-semibold hover:underline">
                      Manage Mock Tests →
                    </Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <CompanyIcon className="w-4 h-4 text-emerald-600" />
                      <span>Company Preparation Tracks</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {companiesTotal} companies
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    Placement recruitment patterns
                  </TableCell>
                  <TableCell>
                    <Link to="/admin/companies" className="text-xs text-primary hover:text-primary-dark font-semibold hover:underline">
                      Manage Companies →
                    </Link>
                  </TableCell>
                </TableRow>

                <TableRow>
                  <TableCell className="font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <ResourcesIcon className="w-4 h-4 text-teal-600" />
                      <span>Study Materials & Handbooks</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-slate-600 font-mono">
                    {resourcesTotal} guides
                  </TableCell>
                  <TableCell className="text-xs text-slate-500 font-mono">
                    Verified reference resources
                  </TableCell>
                  <TableCell>
                    <Link to="/admin/resources" className="text-xs text-primary hover:text-primary-dark font-semibold hover:underline">
                      Manage Resources →
                    </Link>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── 7. Data Integrity Promise Footnote ──────────────────────── */}
      <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-start sm:items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 sm:mt-0">
          <InfoIcon className="w-4 h-4 text-slate-600" />
        </div>
        <div className="leading-relaxed">
          <strong className="text-slate-800">Academic Data Integrity:</strong> All statistics,
          activity distributions, and performance trends on this console are computed directly from
          verified candidate submissions and assessment records.
        </div>
      </div>
    </div>
  );
}
