import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAptitudeMetadata, startAptitudeSession, getAptitudeHistory } from '../../services/aptitudeService.js';
import { formatDate } from '../../utils/formatters.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  Button,
  Select,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  ErrorState,
  Skeleton,
  SkeletonCard,
  AptitudeIcon,
  ClockIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  TrophyIcon,
  CalendarIcon,
} from '../../components/ui/index.js';

// Category metadata for styling and descriptions
const CATEGORY_META = {
  'Quantitative Aptitude': {
    shortName: 'Quantitative',
    description: 'Numbers, algebra, geometry, data interpretation',
    iconBg: 'bg-blue-50',
    iconColor: 'text-blue-600',
    selectedBorder: 'border-blue-600 ring-2 ring-blue-600/10',
    selectedBg: 'bg-blue-50/40',
  },
  'Logical Reasoning': {
    shortName: 'Logical',
    description: 'Patterns, sequences, deduction, critical thinking',
    iconBg: 'bg-indigo-50',
    iconColor: 'text-indigo-600',
    selectedBorder: 'border-indigo-600 ring-2 ring-indigo-600/10',
    selectedBg: 'bg-indigo-50/40',
  },
  'Verbal Ability': {
    shortName: 'Verbal',
    description: 'Vocabulary, grammar, reading comprehension',
    iconBg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
    selectedBorder: 'border-emerald-600 ring-2 ring-emerald-600/10',
    selectedBg: 'bg-emerald-50/40',
  },
};

const DIFFICULTY_OPTIONS = [
  { value: 'mixed', label: 'Mixed (Adaptive)' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const QUESTION_COUNT_OPTIONS = [
  { value: '5', label: '5 Questions' },
  { value: '10', label: '10 Questions' },
  { value: '15', label: '15 Questions' },
  { value: '20', label: '20 Questions' },
];

const TIME_LIMIT_OPTIONS = [
  { value: '5', label: '5 Minutes' },
  { value: '10', label: '10 Minutes' },
  { value: '15', label: '15 Minutes' },
  { value: '20', label: '20 Minutes' },
  { value: '30', label: '30 Minutes' },
];

export default function AptitudePracticePage() {
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [totalAttemptsCount, setTotalAttemptsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  // Configuration Form state
  const [category, setCategory] = useState('Quantitative Aptitude');
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('mixed');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);

  const loadPageData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metaData, historyData] = await Promise.all([
        getAptitudeMetadata(),
        getAptitudeHistory({ limit: 4 }).catch((err) => {
          console.warn('Could not load recent history preview:', err);
          return { attempts: [], pagination: { total: 0 } };
        }),
      ]);

      setMetadata(metaData);
      if (metaData?.categories?.length > 0) {
        setCategory(metaData.categories[0]);
      }

      setRecentAttempts(historyData?.attempts || []);
      setTotalAttemptsCount(historyData?.pagination?.total || 0);
    } catch (err) {
      console.error('Failed to load aptitude page data:', err);
      setError('Could not load test parameters. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPageData();
  }, []);

  const handleStart = async (e) => {
    e.preventDefault();
    setError(null);
    setStarting(true);

    try {
      const data = await startAptitudeSession({
        category: category === 'all' ? undefined : category,
        topic: topic === 'all' ? undefined : topic,
        difficulty: difficulty === 'mixed' ? undefined : difficulty,
        numberOfQuestions: Number(numberOfQuestions),
        timeLimitMinutes: Number(timeLimitMinutes),
      });

      if (data?.sessionId) {
        navigate(`/aptitude/session/${data.sessionId}`);
      }
    } catch (err) {
      console.error('Error starting session:', err);
      setError(err.response?.data?.message || 'Failed to start practice session.');
    } finally {
      setStarting(false);
    }
  };

  const getCategoryCount = (cat) => {
    return metadata?.countsByCategory?.[cat] || 0;
  };

  const handleCategorySelect = (cat) => {
    setCategory(cat);
    setTopic('all');
    const available = metadata?.countsByCategory?.[cat] || 0;
    if (available > 0 && numberOfQuestions > available) {
      setNumberOfQuestions(available >= 5 ? 5 : available);
    }
  };

  const availableCatCount = getCategoryCount(category);
  const questionCountOptions = React.useMemo(() => {
    const steps = [5, 10, 15, 20];
    const maxQ = availableCatCount > 0 ? availableCatCount : 20;
    const filtered = steps.filter((s) => s <= maxQ);
    const opts = filtered.map((s) => ({ value: String(s), label: `${s} Questions` }));
    if (opts.length === 0 && maxQ > 0) {
      opts.push({ value: String(maxQ), label: `${maxQ} Questions (All Available)` });
    }
    return opts;
  }, [availableCatCount]);

  useEffect(() => {
    if (questionCountOptions.length > 0) {
      const exists = questionCountOptions.some(
        (o) => Number(o.value) === Number(numberOfQuestions)
      );
      if (!exists) {
        setNumberOfQuestions(Number(questionCountOptions[0].value));
      }
    }
  }, [questionCountOptions, numberOfQuestions]);

  // Build topic options for the selected category
  const topicOptions = [
    { value: 'all', label: 'All Topics' },
    ...(metadata?.topics || []).map((t) => ({ value: t, label: t })),
  ];

  const catMeta = CATEGORY_META[category] || CATEGORY_META['Quantitative Aptitude'];

  // Calculate real average score from recent submitted attempts
  const completedAttempts = recentAttempts.filter(
    (a) => a.status === 'submitted' || a.status === 'expired'
  );
  const avgPercentage =
    completedAttempts.length > 0
      ? Math.round(
          completedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) /
            completedAttempts.length
        )
      : null;

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="Aptitude Practice"
        description="Build speed, accuracy, and confidence across the quantitative, logical, and verbal skills used in placement assessments."
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Aptitude' },
        ]}
        badge={
          metadata ? (
            <Badge variant="primary" size="sm">
              {metadata.totalQuestions || 0} questions available
            </Badge>
          ) : null
        }
        actions={
          <Link to="/aptitude/history">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<ClockIcon className="w-3.5 h-3.5" />}
            >
              Past Attempts
            </Button>
          </Link>
        }
      />

      {/* ── Error Banner ── */}
      {error && (
        <ErrorState
          title="Session Error"
          message={error}
          onRetry={loadPageData}
        />
      )}

      {/* ── 2. Preparation Overview / Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Question Bank"
          value={metadata?.totalQuestions !== undefined ? metadata.totalQuestions : '—'}
          subtext="Verified placement questions"
          icon={<AptitudeIcon className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          label="Past Attempts"
          value={totalAttemptsCount}
          subtext={totalAttemptsCount === 0 ? 'No sessions completed yet' : 'Total practice sessions'}
          icon={<ClockIcon className="w-4 h-4 text-slate-700" />}
        />
        <StatCard
          label="Recent Accuracy"
          value={avgPercentage !== null ? `${avgPercentage}%` : '—'}
          subtext={
            avgPercentage !== null
              ? 'Based on recent completed tests'
              : 'Complete a test to view accuracy'
          }
          icon={<TrophyIcon className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Active Categories"
          value={metadata?.categories?.length || 3}
          subtext="Quantitative, Logical, Verbal"
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="space-y-6">
          <Card>
            <CardContent>
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent>
              <Skeleton className="h-4 w-40 mb-4" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-9 rounded-lg" />
                <Skeleton className="h-9 rounded-lg" />
                <Skeleton className="h-9 rounded-lg" />
                <Skeleton className="h-9 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <form onSubmit={handleStart} className="space-y-6">
          {/* ── 3. Category Selection Cards ── */}
          <Card>
            <CardContent>
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                  1. Select Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose the aptitude section you want to target for this assessment.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'].map((cat) => {
                  const isSelected = category === cat;
                  const count = getCategoryCount(cat);
                  const meta = CATEGORY_META[cat] || CATEGORY_META['Quantitative Aptitude'];

                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`group text-left p-4 rounded-xl border transition-all duration-150 cursor-pointer ${
                        isSelected
                          ? `${meta.selectedBorder} ${meta.selectedBg}`
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${meta.iconBg}`}
                        >
                          <AptitudeIcon className={`w-4.5 h-4.5 ${meta.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-slate-900 tracking-tight">
                            {meta.shortName}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                            {meta.description}
                          </div>
                          <div className="mt-2.5">
                            <Badge
                              variant={isSelected ? 'primary' : 'default'}
                              size="sm"
                            >
                              {count} question{count === 1 ? '' : 's'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── 4. Practice Configuration ── */}
          <Card>
            <CardContent>
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                  2. Configure Assessment Parameters
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize topic focus, question count, difficulty, and duration.
                  Questions are dynamically sampled by the server.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select
                  label="Specific Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  options={topicOptions}
                />

                <Select
                  label="Difficulty Level"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  options={DIFFICULTY_OPTIONS}
                />

                <Select
                  label="Number of Questions"
                  value={String(numberOfQuestions)}
                  onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                  options={questionCountOptions}
                />

                <Select
                  label="Time Limit"
                  value={String(timeLimitMinutes)}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  options={TIME_LIMIT_OPTIONS}
                />
              </div>
            </CardContent>

            {/* ── 5. Start Practice Area & Session Summary ── */}
            <CardFooter>
              <div className="flex items-center gap-4 text-slate-600 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 font-medium">
                  <AptitudeIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{catMeta.shortName}</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{numberOfQuestions} Questions</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{timeLimitMinutes} Minutes</span>
                </div>
                {difficulty !== 'mixed' && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="capitalize text-slate-500 font-medium">{difficulty}</span>
                  </>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                loading={starting}
                disabled={metadata?.totalQuestions === 0}
                iconRight={!starting ? <ArrowRightIcon className="w-4 h-4" /> : null}
              >
                {starting ? 'Preparing Questions…' : 'Start Practice Session'}
              </Button>
            </CardFooter>
          </Card>

          {/* ── 6. Recent Attempt / History Preview ── */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Recent Attempts</CardTitle>
                <CardDescription>
                  Your latest aptitude practice sessions and performance records.
                </CardDescription>
              </div>
              <Link to="/aptitude/history">
                <Button variant="ghost" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
                  View All History
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="p-0">
              {recentAttempts.length === 0 ? (
                <div className="p-8 text-center">
                  <EmptyState
                    title="No practice attempts recorded"
                    description="Configure your parameters above and start your first session to track your placement readiness."
                  />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category / Topic</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentAttempts.map((attempt) => {
                      const dateStr = formatDate(attempt.createdAt);

                      return (
                        <TableRow key={attempt._id}>
                          <TableCell className="text-slate-500 text-xs">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dateStr}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 text-xs">
                            <div>{attempt.category || 'General Aptitude'}</div>
                            {attempt.topic && attempt.topic !== 'all' && (
                              <div className="text-[11px] text-slate-500">{attempt.topic}</div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize text-xs text-slate-600 font-medium">
                              {attempt.difficulty || 'mixed'}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                            {attempt.totalQuestions || 0} Qs
                          </TableCell>
                          <TableCell className="text-xs">
                            {attempt.status === 'in_progress' ? (
                              <span className="text-slate-400 italic">In progress</span>
                            ) : (
                              <div className="font-mono font-semibold text-slate-900">
                                {attempt.score || 0} / {attempt.totalQuestions || 0}
                                <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                                  ({attempt.percentage || 0}%)
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={attempt.status} />
                          </TableCell>
                          <TableCell className="text-right">
                            {attempt.status === 'in_progress' ? (
                              <Link to={`/aptitude/session/${attempt._id}`}>
                                <Button variant="outline" size="sm">
                                  Resume
                                </Button>
                              </Link>
                            ) : (
                              <Link to={`/aptitude/result/${attempt._id}`}>
                                <Button variant="ghost" size="sm">
                                  Review
                                </Button>
                              </Link>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* ── 7. Preparation Guidance ── */}
          <Card>
            <CardContent>
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
                  <AlertTriangleIcon className="w-4.5 h-4.5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
                    Assessment Preparation Guidelines
                  </h3>
                  <ul className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>
                        <strong>Dynamic Question Randomization:</strong> Questions are sampled directly from the placement question bank. No two sessions share identical question sets.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>
                        <strong>Timed Conditions:</strong> The session timer runs continuously once questions load. Practice working under strict pacing constraints.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>
                        <strong>Instant Solutions & Explanations:</strong> Comprehensive step-by-step solutions and answer keys are accessible immediately upon submission.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>
                        <strong>Progress Tracking:</strong> All scores and detailed reviews are preserved in your past attempts for diagnostic analysis.
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
