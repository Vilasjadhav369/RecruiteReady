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
} from '../components/ui/index.js';
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  DocumentIcon,
  TrophyIcon,
  SparklesIcon,
  FireIcon,
  ClockIcon,
} from '../components/ui/Icons.jsx';

/**
 * Clean SVG-based Score Trend Line Chart
 * Renders only when at least 2 real historical evaluations exist.
 * Uses strictly RecruitReady brand green (#166534) and rose (#E11D48) for mock tests.
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

  const width = 720;
  const height = 230;
  const paddingX = 45;
  const paddingY = 32;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calculate coordinates for points
  const points = trend.map((item, idx) => {
    const x = paddingX + (idx / (trend.length - 1)) * chartWidth;
    const clampedPct = Math.min(100, Math.max(0, item.percentage || 0));
    const y = paddingY + chartHeight - (clampedPct / 100) * chartHeight;
    return { ...item, x, y, clampedPct };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-3.5">
      {/* Chart Legend */}
      <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#166534] inline-block" />
            <span className="text-[11px] font-medium text-slate-700">Aptitude Practice</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E11D48] inline-block" />
            <span className="text-[11px] font-medium text-slate-700">Mock Assessment</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {trend.length} Historical {trend.length === 1 ? 'Evaluation' : 'Evaluations'}
        </span>
      </div>

      {/* Responsive SVG Graphic */}
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

          {/* Horizontal gridlines */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const y = paddingY + chartHeight - (pct / 100) * chartHeight;
            return (
              <g key={pct}>
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="#E2E8F0"
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

          {/* Area fill under trendline */}
          {points.length > 1 && (
            <polygon
              fill="url(#trendGradient)"
              points={`${points[0].x},${paddingY + chartHeight} ${polylinePoints} ${points[points.length - 1].x},${paddingY + chartHeight}`}
            />
          )}

          {/* Connective Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#166534"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {/* Data Points */}
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

export default function ProgressPage() {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topicTab, setTopicTab] = useState('aptitude');

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

  const { summary, aptitude, coding, mockTests, scoreTrend = [], recentActivity = [] } = data || {};

  // Check if student has recorded any activity across any track
  const hasAptitudeActivity = (aptitude?.totalAttempts || 0) > 0;
  const hasCodingActivity = (coding?.totalSubmissions || 0) > 0;
  const hasMockTestActivity = (mockTests?.totalAttempts || 0) > 0;
  const hasAnyActivity = hasAptitudeActivity || hasCodingActivity || hasMockTestActivity;

  // Derive factual, honest insights based strictly on verified numbers
  const factualInsights = useMemo(() => {
    const list = [];
    if (!hasAnyActivity) return list;

    if (hasAptitudeActivity && aptitude?.averagePercentage !== null && aptitude?.averagePercentage !== undefined) {
      list.push({
        text: `Your overall aptitude accuracy across ${aptitude.completedSessions || 0} completed session(s) is ${aptitude.averagePercentage}%.`,
        track: 'Aptitude',
      });
    }

    if (aptitude?.topicPerformance && aptitude.topicPerformance.length > 0) {
      const sortedByAccuracy = [...aptitude.topicPerformance].sort((a, b) => b.accuracy - a.accuracy);
      const highest = sortedByAccuracy[0];
      if (highest && highest.total >= 2) {
        list.push({
          text: `${highest.topic} is currently your highest-accuracy aptitude topic at ${highest.accuracy}% (${highest.correct}/${highest.total} correct).`,
          track: 'Aptitude',
        });
      }
      const lowest = sortedByAccuracy[sortedByAccuracy.length - 1];
      if (lowest && lowest.accuracy < 50 && lowest.total >= 2) {
        list.push({
          text: `${lowest.topic} accuracy is currently at ${lowest.accuracy}%, and would benefit from dedicated practice.`,
          track: 'Improvement',
        });
      }
    }

    if (hasCodingActivity) {
      const rateText = coding.acceptanceRate !== null ? ` with an acceptance rate of ${coding.acceptanceRate}%` : '';
      list.push({
        text: `You have solved ${coding.problemsSolved || 0} unique coding problem(s)${rateText} across ${coding.totalSubmissions || 0} submissions.`,
        track: 'Coding',
      });
    }

    if (hasMockTestActivity && (mockTests?.completed || 0) > 0) {
      list.push({
        text: `Completed ${mockTests.completed} full-length mock assessment(s) with an average score of ${mockTests.averagePercentage || 0}%.`,
        track: 'Mock Tests',
      });
    }

    return list;
  }, [aptitude, coding, mockTests, hasAnyActivity, hasAptitudeActivity, hasCodingActivity, hasMockTestActivity]);

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Your Progress' },
  ];

  const headerActions = (
    <div className="flex items-center gap-2.5 flex-wrap">
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/aptitude')}
      >
        Practice Aptitude
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => navigate('/coding')}
      >
        Solve Coding
      </Button>
      <Button
        variant="primary"
        size="sm"
        onClick={() => navigate('/mock-tests')}
      >
        Take Mock Test
      </Button>
    </div>
  );

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Your Progress & Analytics"
        description="Factual tracking of your preparation activity, accuracy trends, and assessment performance."
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

      {/* Main Content States */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
            <SkeletonCard className="h-32" />
            <SkeletonCard className="h-32" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, idx) => (
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
        <EmptyState
          icon={<ChartBarIcon className="w-8 h-8 text-[#166534]" />}
          title="Your progress starts here."
          description="Complete aptitude practice sessions, coding problems, or mock tests to begin recording authentic preparation analytics."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Button
                variant="primary"
                onClick={() => navigate('/aptitude')}
              >
                Practice Aptitude
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/coding')}
              >
                Practice Coding
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/mock-tests')}
              >
                Take a Mock Test
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Top Row: Consistency Tracker + Total Preparation Aggregate */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Consistency Tracker */}
            <Card className="border-slate-200/80 shadow-xs bg-white">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shrink-0">
                  <FireIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Preparation Streak
                    </span>
                    <Badge variant={summary?.streakDays > 0 ? 'success' : 'neutral'}>
                      {summary?.streakDays > 0 ? `${summary.streakDays} Day Streak` : 'Consistency Tracker'}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                      {summary?.streakDays || 0}
                    </span>
                    <span className="text-xs text-slate-500">
                      {summary?.streakDays === 1 ? 'active calendar day' : 'active calendar days'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    Derived strictly from consecutive calendar days with recorded submissions or completed tests.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Total Preparation Activities */}
            <Card className="border-slate-200/80 shadow-xs bg-white">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/70 text-[#166534] flex items-center justify-center shrink-0">
                  <CheckCircleIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Completed Activities
                    </span>
                    <Badge variant="primary">
                      Verified Data
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold font-mono text-slate-900 tracking-tight">
                      {summary?.totalCompletedActivities || 0}
                    </span>
                    <span className="text-xs text-slate-500">total activities completed</span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                    {aptitude?.completedSessions || 0} aptitude {aptitude?.completedSessions === 1 ? 'session' : 'sessions'} • {coding?.problemsSolved || 0} coding {coding?.problemsSolved === 1 ? 'problem' : 'problems'} • {mockTests?.completed || 0} mock {mockTests?.completed === 1 ? 'test' : 'tests'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top 6 Summary KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              label="Questions Answered"
              value={aptitude?.questionsAttempted || 0}
              subtext={`${aptitude?.completedSessions || 0} ${aptitude?.completedSessions === 1 ? 'session' : 'sessions'}`}
              icon={<AptitudeIcon className="w-4 h-4 text-[#166534]" />}
            />
            <StatCard
              label="Aptitude Accuracy"
              value={aptitude?.averagePercentage !== null && aptitude?.averagePercentage !== undefined ? `${aptitude.averagePercentage}%` : '—'}
              subtext={`${aptitude?.correctTotal || 0} correct answers`}
              icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              label="Problems Solved"
              value={coding?.problemsSolved || 0}
              subtext={`${coding?.attemptedProblems || 0} attempted`}
              icon={<CodingIcon className="w-4 h-4 text-slate-700" />}
            />
            <StatCard
              label="Acceptance Rate"
              value={coding?.acceptanceRate !== null && coding?.acceptanceRate !== undefined ? `${coding.acceptanceRate}%` : '—'}
              subtext={`${coding?.acceptedSubmissions || 0} of ${coding?.totalSubmissions || 0} accepted`}
              icon={<DocumentIcon className="w-4 h-4 text-slate-600" />}
            />
            <StatCard
              label="Mock Tests"
              value={mockTests?.completed || 0}
              subtext={`${mockTests?.totalAttempts || 0} total attempts`}
              icon={<MockTestIcon className="w-4 h-4 text-rose-600" />}
            />
            <StatCard
              label="Mock Avg Score"
              value={mockTests?.averagePercentage !== null && mockTests?.averagePercentage !== undefined ? `${mockTests.averagePercentage}%` : '—'}
              subtext={mockTests?.bestPercentage !== null && mockTests?.bestPercentage !== undefined ? `Best: ${mockTests.bestPercentage}%` : 'No score yet'}
              icon={<TrophyIcon className="w-4 h-4 text-amber-600" />}
            />
          </div>

          {/* Module-by-Module Domain Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Aptitude Track Card */}
            <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#166534] border border-emerald-100 flex items-center justify-center shrink-0">
                      <AptitudeIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Aptitude Practice</CardTitle>
                    </div>
                  </div>
                  {hasAptitudeActivity && aptitude?.averagePercentage !== null && (
                    <Badge variant="success">{aptitude.averagePercentage}% Avg</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {hasAptitudeActivity ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Completed Practice Sessions</span>
                        <span className="font-bold text-slate-900 font-mono">{aptitude.completedSessions}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Total Practice Attempts</span>
                        <span className="font-bold text-slate-900 font-mono">{aptitude.totalAttempts}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Questions Attempted</span>
                        <span className="font-bold text-slate-900 font-mono">{aptitude.questionsAttempted}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Correct Answers</span>
                        <span className="font-bold text-emerald-600 font-mono">{aptitude.correctTotal}</span>
                      </div>

                      {/* Progress bar */}
                      <div className="pt-2">
                        <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                          <span>Average Accuracy</span>
                          <span className="font-mono text-slate-600 font-semibold">{aptitude.averagePercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#166534] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, aptitude.averagePercentage || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-500 mb-3">
                        No aptitude sessions completed yet.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/aptitude')}
                      >
                        Start Practice
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>

              {hasAptitudeActivity && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to="/aptitude/history"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 no-underline hover:underline"
                  >
                    View History
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/aptitude')}
                    className="text-xs text-[#166534] hover:text-[#14532D]"
                  >
                    Go to Aptitude
                  </Button>
                </div>
              )}
            </Card>

            {/* Coding Track Card */}
            <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 flex items-center justify-center shrink-0">
                      <CodingIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Coding Practice</CardTitle>
                    </div>
                  </div>
                  {hasCodingActivity && (
                    <Badge variant="neutral">{coding.problemsSolved} Solved</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {hasCodingActivity ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Total Submissions</span>
                        <span className="font-bold text-slate-900 font-mono">{coding.totalSubmissions}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Attempted Problems</span>
                        <span className="font-bold text-slate-900 font-mono">{coding.attemptedProblems}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Accepted Submissions</span>
                        <span className="font-bold text-emerald-600 font-mono">{coding.acceptedSubmissions}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Unique Problems Solved</span>
                        <span className="font-bold text-[#166534] font-mono">{coding.problemsSolved}</span>
                      </div>

                      {/* Language badges */}
                      {coding.languageBreakdown && Object.keys(coding.languageBreakdown).length > 0 && (
                        <div className="pt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                            Languages Used
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {Object.entries(coding.languageBreakdown).map(([lang, count]) => (
                              <span
                                key={lang}
                                className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-slate-700 text-[11px] font-mono"
                              >
                                {lang}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-500 mb-3">
                        No coding submissions recorded yet.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/coding')}
                      >
                        Solve Problems
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>

              {hasCodingActivity && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to="/coding/history"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 no-underline hover:underline"
                  >
                    View History
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/coding')}
                    className="text-xs text-slate-700 hover:text-slate-900"
                  >
                    Go to Coding
                  </Button>
                </div>
              )}
            </Card>

            {/* Mock Tests Track Card */}
            <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 border border-rose-100 flex items-center justify-center shrink-0">
                      <MockTestIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-base">Mock Assessments</CardTitle>
                    </div>
                  </div>
                  {hasMockTestActivity && mockTests?.averagePercentage !== null && (
                    <Badge variant="danger">{mockTests.averagePercentage}% Avg</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {hasMockTestActivity ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Completed Exams</span>
                        <span className="font-bold text-slate-900 font-mono">{mockTests.completed}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Total Attempts</span>
                        <span className="font-bold text-slate-900 font-mono">{mockTests.totalAttempts}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Expired / Timed Out</span>
                        <span className="font-bold text-slate-600 font-mono">{mockTests.expired}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Average Percentage</span>
                        <span className="font-bold text-rose-600 font-mono">
                          {mockTests.averagePercentage !== null ? `${mockTests.averagePercentage}%` : '—'}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="pt-2">
                        <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1.5">
                          <span>Exam Performance</span>
                          <span className="font-mono text-slate-600 font-semibold">{mockTests.averagePercentage || 0}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#E11D48] h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(0, mockTests.averagePercentage || 0))}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center">
                      <p className="text-xs text-slate-500 mb-3">
                        No full mock tests completed yet.
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate('/mock-tests')}
                      >
                        Take Mock Test
                      </Button>
                    </div>
                  )}
                </CardContent>
              </div>

              {hasMockTestActivity && (
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Link
                    to="/mock-tests/history"
                    className="text-xs font-semibold text-slate-600 hover:text-slate-900 no-underline hover:underline"
                  >
                    View History
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/mock-tests')}
                    className="text-xs text-rose-700 hover:text-rose-800"
                  >
                    Go to Mock Tests
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Historical Attempt Performance / Score Trend */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Historical Evaluation Timeline
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Chronological performance across completed aptitude sessions and submitted mock assessments.
                  </p>
                </div>
                <span className="text-xs text-slate-500 font-mono">
                  Accuracy Timeline
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ScoreTrendChart trend={scoreTrend} />
            </CardContent>
          </Card>

          {/* Topic Performance Breakdown: Aptitude + Coding */}
          {((aptitude?.topicPerformance && aptitude.topicPerformance.length > 0) ||
            (coding?.topicPerformance && coding.topicPerformance.length > 0)) && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-base sm:text-lg">
                    Topic Performance Breakdown
                  </CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Authentic domain statistics derived from individual questions and submissions.
                  </p>
                </div>

                {/* Tab switch between Aptitude and Coding topics */}
                <div className="flex items-center rounded-lg bg-slate-100 p-1 border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setTopicTab('aptitude')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      topicTab === 'aptitude'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Aptitude Topics ({aptitude?.topicPerformance?.length || 0})
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopicTab('coding')}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      topicTab === 'coding'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Coding Topics ({coding?.topicPerformance?.length || 0})
                  </button>
                </div>
              </CardHeader>

              <CardContent className="p-0 overflow-x-auto">
                {topicTab === 'aptitude' ? (
                  aptitude?.topicPerformance && aptitude.topicPerformance.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Topic Area</TableHead>
                          <TableHead>Questions Attempted</TableHead>
                          <TableHead>Correct Answers</TableHead>
                          <TableHead className="text-right">Accuracy Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {aptitude.topicPerformance.map((tp, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-semibold text-slate-900">
                              {tp.topic}
                            </TableCell>
                            <TableCell className="font-mono text-slate-700">
                              {tp.total}
                            </TableCell>
                            <TableCell className="font-bold text-emerald-600 font-mono">
                              {tp.correct}
                            </TableCell>
                            <TableCell className="text-right">
                              <span className="font-bold text-[#166534] font-mono text-xs">
                                {tp.accuracy}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-500">
                      No aptitude topic breakdown data recorded yet.
                    </div>
                  )
                ) : coding?.topicPerformance && coding.topicPerformance.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Topic / Category</TableHead>
                        <TableHead>Submissions Attempted</TableHead>
                        <TableHead>Accepted Solutions</TableHead>
                        <TableHead className="text-right">Completion Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {coding.topicPerformance.map((tp, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-semibold text-slate-900">
                            {tp.topic}
                          </TableCell>
                          <TableCell className="font-mono text-slate-700">
                            {tp.attempted}
                          </TableCell>
                          <TableCell className="font-bold text-emerald-600 font-mono">
                            {tp.solved}
                          </TableCell>
                          <TableCell className="text-right">
                            <Badge variant={tp.solved > 0 ? 'success' : 'neutral'}>
                              {tp.solved > 0 ? 'Solved' : 'Attempted'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="p-8 text-center text-xs text-slate-500">
                    No coding topic breakdown data recorded yet.
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Unified Recent Activity Feed */}
          {recentActivity && recentActivity.length > 0 && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base sm:text-lg">Recent Preparation Activity</CardTitle>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unified chronological stream of your latest attempts, assessments, and code submissions.
                  </p>
                </div>
                <ClockIcon className="w-4 h-4 text-slate-400" />
              </CardHeader>
              <CardContent className="p-0 divide-y divide-slate-100">
                {recentActivity.map((act) => {
                  const isAptitude = act.type === 'aptitude';
                  const isCoding = act.type === 'coding';
                  const isMock = act.type === 'mock_test';

                  const iconEl = isAptitude ? (
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#166534] border border-emerald-100 flex items-center justify-center shrink-0">
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
                    <div key={act.id} className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {iconEl}
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate">
                            {act.title}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {act.subtitle}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <Badge variant={statusBadgeVariant}>
                          {act.status ? act.status.replace(/_/g, ' ') : 'recorded'}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
                          {act.timestamp ? new Date(act.timestamp).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Factual Insights Section */}
          {factualInsights.length > 0 && (
            <Card className="border-slate-200/80 bg-slate-50/50 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-200/60 flex flex-row items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-[#166534]" />
                <CardTitle className="text-base">Preparation Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {factualInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#166534] mt-2 shrink-0" />
                      <span>{insight.text}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
