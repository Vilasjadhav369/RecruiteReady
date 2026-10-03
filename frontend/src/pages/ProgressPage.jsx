import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '../components/ui/Icons.jsx';

/**
 * Clean SVG-based Score Trend Line Chart
 * Renders only when real historical attempt data exists.
 */
function ScoreTrendChart({ trend = [] }) {
  if (!trend || trend.length === 0) {
    return (
      <div className="p-8 text-center bg-slate-50 border border-slate-200/80 rounded-xl">
        <p className="text-xs text-slate-500 font-medium">
          More activity is needed to show performance trends.
        </p>
        <span className="text-[11px] text-slate-400 mt-1 block">
          Complete aptitude sessions or full mock assessments to generate your accuracy timeline.
        </span>
      </div>
    );
  }

  const width = 700;
  const height = 220;
  const paddingX = 40;
  const paddingY = 30;
  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Calculate coordinates for points
  const points = trend.map((item, idx) => {
    const x =
      trend.length === 1
        ? paddingX + chartWidth / 2
        : paddingX + (idx / (trend.length - 1)) * chartWidth;
    const y = paddingY + chartHeight - (Math.min(100, Math.max(0, item.percentage || 0)) / 100) * chartHeight;
    return { ...item, x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <div className="space-y-3">
      {/* Chart Legend */}
      <div className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block" />
            <span className="text-[11px] font-medium text-slate-700">Aptitude</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span className="text-[11px] font-medium text-slate-700">Mock Test</span>
          </div>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {trend.length} Historical {trend.length === 1 ? 'Attempt' : 'Attempts'}
        </span>
      </div>

      {/* Responsive SVG Graphic */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[500px] overflow-visible"
        >
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
                  x={paddingX - 8}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-slate-400 font-mono"
                >
                  {pct}%
                </text>
              </g>
            );
          })}

          {/* Connective Line */}
          {points.length > 1 && (
            <polyline
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              points={polylinePoints}
            />
          )}

          {/* Interactive Data Dots */}
          {points.map((p, idx) => {
            const isMock = p.type === 'Mock Test';
            const color = isMock ? '#F43F5E' : '#2563EB';
            return (
              <g key={idx} className="cursor-pointer group">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill="white"
                  stroke={color}
                  strokeWidth="2.5"
                  className="transition-transform group-hover:scale-125"
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

  const { aptitude, coding, mockTests, scoreTrend = [] } = data || {};

  // Check if student has recorded any activity across any track
  const hasAptitudeActivity = (aptitude?.totalAttempts || 0) > 0;
  const hasCodingActivity = (coding?.totalSubmissions || 0) > 0;
  const hasMockTestActivity = (mockTests?.completed || 0) > 0;
  const hasAnyActivity = hasAptitudeActivity || hasCodingActivity || hasMockTestActivity;

  // Derive factual, honest insights based strictly on verified numbers
  const factualInsights = useMemo(() => {
    const list = [];
    if (!hasAnyActivity) return list;

    if (hasAptitudeActivity && aptitude?.averagePercentage > 0) {
      list.push({
        text: `Your overall aptitude average accuracy across ${aptitude.totalAttempts} sessions is ${aptitude.averagePercentage}%.`,
        track: 'Aptitude',
      });
    }

    if (aptitude?.topicPerformance && aptitude.topicPerformance.length > 0) {
      const sortedByAccuracy = [...aptitude.topicPerformance].sort((a, b) => b.accuracy - a.accuracy);
      const highest = sortedByAccuracy[0];
      if (highest && highest.total >= 2) {
        list.push({
          text: `${highest.topic} is currently your highest-accuracy topic at ${highest.accuracy}% (${highest.correct}/${highest.total} correct).`,
          track: 'Aptitude',
        });
      }
      const lowest = sortedByAccuracy[sortedByAccuracy.length - 1];
      if (lowest && lowest.accuracy < 50 && lowest.total >= 2) {
        list.push({
          text: `${lowest.topic} accuracy is currently at ${lowest.accuracy}%, and would benefit from dedicated review.`,
          track: 'Improvement',
        });
      }
    }

    if (hasCodingActivity) {
      const acceptanceRate =
        coding.totalSubmissions > 0
          ? Math.round((coding.acceptedSubmissions / coding.totalSubmissions) * 100)
          : 0;
      list.push({
        text: `You have solved ${coding.problemsSolved} unique problem(s) with an acceptance rate of ${acceptanceRate}% across ${coding.totalSubmissions} submissions.`,
        track: 'Coding',
      });
    }

    if (hasMockTestActivity) {
      list.push({
        text: `Completed ${mockTests.completed} full-length mock assessment(s) with an average score of ${mockTests.averagePercentage}%.`,
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
        title="Your Progress"
        description="Track your preparation activity and understand where you are improving."
        breadcrumbs={breadcrumbs}
        badge={
          hasAnyActivity ? (
            <Badge variant="success" dot>
              Active Progress
            </Badge>
          ) : null
        }
        actions={headerActions}
      />

      {/* Main Content States */}
      {loading ? (
        <div className="space-y-6">
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
          icon={<ChartBarIcon className="w-8 h-8 text-blue-600" />}
          title="Your progress starts here."
          description="Complete aptitude practice, coding problems, or mock tests to start building your preparation history."
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
          {/* Top Summary Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <StatCard
              label="Questions Answered"
              value={aptitude?.questionsAttempted || 0}
              subtext="Aptitude sessions"
              icon={<AptitudeIcon className="w-4 h-4 text-blue-600" />}
            />
            <StatCard
              label="Aptitude Accuracy"
              value={`${aptitude?.averagePercentage || 0}%`}
              subtext="Overall average"
              icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
            />
            <StatCard
              label="Problems Solved"
              value={coding?.problemsSolved || 0}
              subtext="Unique challenges"
              icon={<CodingIcon className="w-4 h-4 text-indigo-600" />}
            />
            <StatCard
              label="Submissions"
              value={coding?.totalSubmissions || 0}
              subtext={`${coding?.acceptedSubmissions || 0} accepted`}
              icon={<DocumentIcon className="w-4 h-4 text-slate-600" />}
            />
            <StatCard
              label="Mock Tests"
              value={mockTests?.completed || 0}
              subtext="Completed exams"
              icon={<MockTestIcon className="w-4 h-4 text-rose-500" />}
            />
            <StatCard
              label="Mock Avg Score"
              value={`${mockTests?.averagePercentage || 0}%`}
              subtext="Simulated assessments"
              icon={<TrophyIcon className="w-4 h-4 text-amber-500" />}
            />
          </div>

          {/* Module-by-Module Preparation Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Aptitude Track Card */}
            <Card className="border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <AptitudeIcon className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-base">Aptitude Practice</CardTitle>
                  </div>
                  {hasAptitudeActivity && (
                    <Badge variant="primary">{aptitude.averagePercentage}% Avg</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {hasAptitudeActivity ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Sessions Completed</span>
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
                        <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1">
                          <span>Average Accuracy</span>
                          <span>{aptitude.averagePercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-500"
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
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/aptitude')}
                    className="text-xs text-blue-600 hover:text-blue-700"
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
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <CodingIcon className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-base">Coding Practice</CardTitle>
                  </div>
                  {hasCodingActivity && (
                    <Badge variant="secondary">{coding.problemsSolved} Solved</Badge>
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
                        <span>Accepted Solutions</span>
                        <span className="font-bold text-emerald-600 font-mono">{coding.acceptedSubmissions}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Unique Problems Solved</span>
                        <span className="font-bold text-indigo-600 font-mono">{coding.problemsSolved}</span>
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
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/coding')}
                    className="text-xs text-indigo-600 hover:text-indigo-700"
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
                    <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                      <MockTestIcon className="w-4 h-4" />
                    </div>
                    <CardTitle className="text-base">Mock Assessments</CardTitle>
                  </div>
                  {hasMockTestActivity && (
                    <Badge variant="danger">{mockTests.averagePercentage}% Avg</Badge>
                  )}
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {hasMockTestActivity ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Exams Completed</span>
                        <span className="font-bold text-slate-900 font-mono">{mockTests.completed}</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-600">
                        <span>Average Percentage</span>
                        <span className="font-bold text-rose-600 font-mono">{mockTests.averagePercentage}%</span>
                      </div>

                      {/* Progress bar */}
                      <div className="pt-2">
                        <div className="flex justify-between text-[11px] text-slate-400 font-medium mb-1">
                          <span>Exam Performance</span>
                          <span>{mockTests.averagePercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-rose-500 h-2 rounded-full transition-all duration-500"
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
                <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                    onClick={() => navigate('/mock-tests')}
                    className="text-xs text-rose-600 hover:text-rose-700"
                  >
                    Go to Mock Tests
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Performance Visualization / Score Trend */}
          <Card className="border-slate-200/80 shadow-xs">
            <CardHeader className="pb-3 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">
                  Historical Attempt Performance
                </CardTitle>
                <span className="text-xs text-slate-400 font-medium">
                  Timeline Accuracy
                </span>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <ScoreTrendChart trend={scoreTrend} />
            </CardContent>
          </Card>

          {/* Aptitude Topic Breakdown Table (if available) */}
          {aptitude?.topicPerformance && aptitude.topicPerformance.length > 0 && (
            <Card className="border-slate-200/80 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
                <CardTitle className="text-base sm:text-lg">
                  Aptitude Topic Breakdown
                </CardTitle>
                <span className="text-xs text-slate-500 font-medium">
                  {aptitude.topicPerformance.length} Evaluated {aptitude.topicPerformance.length === 1 ? 'Topic' : 'Topics'}
                </span>
              </CardHeader>
              <CardContent className="p-0 overflow-x-auto">
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
                        <TableCell className="font-mono">
                          {tp.total}
                        </TableCell>
                        <TableCell className="font-bold text-emerald-600 font-mono">
                          {tp.correct}
                        </TableCell>
                        <TableCell className="text-right font-bold text-blue-600 font-mono">
                          {tp.accuracy}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Factual Insights Section */}
          {factualInsights.length > 0 && (
            <Card className="border-slate-200/80 bg-slate-50/50 shadow-xs">
              <CardHeader className="pb-3 border-b border-slate-200/60 flex flex-row items-center gap-2">
                <SparklesIcon className="w-4 h-4 text-blue-600" />
                <CardTitle className="text-base">Preparation Insights</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {factualInsights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
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
