import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

// Dynamic category descriptions and styling based on brand green/mint palette
const CATEGORY_STYLE_DEFAULTS = {
  'Quantitative Aptitude': {
    shortName: 'Quantitative',
    description: 'Arithmetic, algebra, geometry, percentages, and data interpretation.',
  },
  'Logical Reasoning': {
    shortName: 'Logical',
    description: 'Number series, deductive logic, seating arrangements, and analytical puzzles.',
  },
  'Verbal Ability': {
    shortName: 'Verbal',
    description: 'Reading comprehension, grammar, vocabulary, sentence correction, and verbal logic.',
  },
};

const DIFFICULTY_OPTIONS = [
  { value: 'mixed', label: 'Mixed (Adaptive)' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
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
  const [searchParams] = useSearchParams();
  const configFormRef = useRef(null);

  const [metadata, setMetadata] = useState(null);
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [totalAttemptsCount, setTotalAttemptsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  // Configuration Form state
  const [category, setCategory] = useState('');
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

      const topicParam = searchParams.get('topic');
      const categoryParam = searchParams.get('category');

      let targetCategory = metaData?.categories?.length > 0 ? metaData.categories[0] : '';
      let targetTopic = 'all';

      // 1. If category param is present, try to match it
      if (categoryParam && metaData?.categories?.length > 0) {
        const matchedCat = metaData.categories.find(
          (c) => c.toLowerCase().trim() === categoryParam.toLowerCase().trim()
        );
        if (matchedCat) {
          targetCategory = matchedCat;
        }
      }

      // 2. If topic param is present, try case-insensitive match against metadata.topics
      if (topicParam && metaData?.topics?.length > 0) {
        const matchedTopic = metaData.topics.find(
          (t) => t.toLowerCase().trim() === topicParam.toLowerCase().trim()
        );
        if (matchedTopic) {
          targetTopic = matchedTopic;

          // Check if topic is known to belong to a particular category (fallback map)
          const TOPIC_CATEGORY_FALLBACK = {
            'time and work': 'Quantitative Aptitude',
            'profit and loss': 'Quantitative Aptitude',
            'average': 'Quantitative Aptitude',
            'ratio and proportion': 'Quantitative Aptitude',
            'permutations and combinations': 'Quantitative Aptitude',
            'probability': 'Quantitative Aptitude',
            'number systems': 'Quantitative Aptitude',
            'compound interest': 'Quantitative Aptitude',
            'boats and streams': 'Quantitative Aptitude',
            'blood relations': 'Logical Reasoning',
            'coding-decoding': 'Logical Reasoning',
            'syllogisms': 'Logical Reasoning',
            'number series': 'Logical Reasoning',
            'directions': 'Logical Reasoning',
            'seating arrangement': 'Logical Reasoning',
            'venn diagrams': 'Logical Reasoning',
            'vocabulary': 'Verbal Ability',
            'sentence correction': 'Verbal Ability',
            'sentence completion': 'Verbal Ability',
            'para jumbles': 'Verbal Ability',
          };

          const mappedCat = TOPIC_CATEGORY_FALLBACK[matchedTopic.toLowerCase().trim()];
          if (mappedCat && metaData.categories.includes(mappedCat)) {
            targetCategory = mappedCat;
          }
        }
      }

      setCategory(targetCategory);
      setTopic(targetTopic);

      // If a topic or category deep link was provided, scroll smoothly to the configuration form
      if (topicParam || categoryParam) {
        setTimeout(() => {
          if (configFormRef.current) {
            const prefersReducedMotion =
              typeof window !== 'undefined' &&
              window.matchMedia &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            configFormRef.current.scrollIntoView({
              behavior: prefersReducedMotion ? 'auto' : 'smooth',
              block: 'start',
            });
          }
        }, 100);
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
  }, [searchParams]);

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

  // Dynamically compute question count options bounded by actual available questions
  const questionCountOptions = useMemo(() => {
    const steps = [5, 10, 15, 20];
    const maxQ = availableCatCount > 0 ? availableCatCount : (metadata?.totalQuestions || 20);
    const filtered = steps.filter((s) => s <= maxQ);
    const opts = filtered.map((s) => ({ value: String(s), label: `${s} Questions` }));
    if (opts.length === 0 && maxQ > 0) {
      opts.push({ value: String(maxQ), label: `${maxQ} Questions (${maxQ === 1 ? '1 Available' : 'All Available'})` });
    }
    return opts;
  }, [availableCatCount, metadata?.totalQuestions]);

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

  const handleStart = async (e) => {
    e.preventDefault();
    setError(null);
    setStarting(true);

    try {
      const data = await startAptitudeSession({
        category: category === 'all' || !category ? undefined : category,
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

  // Compute accurate question counts by difficulty for currently selected category or topic
  const difficultyBreakdown = useMemo(() => {
    if (!metadata) return null;

    // If specific topic is selected and we have topic-level counts
    if (topic && topic !== 'all' && metadata.countsByTopicAndDifficulty?.[topic]) {
      const counts = metadata.countsByTopicAndDifficulty[topic];
      return {
        easy: counts.easy || 0,
        medium: counts.medium || 0,
        hard: counts.hard || 0,
        total: (counts.easy || 0) + (counts.medium || 0) + (counts.hard || 0),
        scope: topic,
      };
    }

    // Otherwise use category-level difficulty breakdown
    if (category && metadata.countsByDifficulty?.[category]) {
      const counts = metadata.countsByDifficulty[category];
      return {
        easy: counts.easy || 0,
        medium: counts.medium || 0,
        hard: counts.hard || 0,
        total: (counts.easy || 0) + (counts.medium || 0) + (counts.hard || 0),
        scope: category,
      };
    }

    return null;
  }, [metadata, category, topic]);

  // Build topic options for the selected category
  const topicOptions = [
    { value: 'all', label: 'All Topics' },
    ...(metadata?.topics || []).map((t) => ({ value: t, label: t })),
  ];

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
    <div className="max-w-[1240px] mx-auto space-y-6 sm:space-y-7 pb-10">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="Aptitude Practice"
        description="Build speed, accuracy, and confidence through structured aptitude practice."
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Aptitude' },
        ]}
        badge={
          metadata ? (
            <Badge variant="brand" size="sm">
              {metadata.totalQuestions || 0}{' '}
              {metadata.totalQuestions === 1 ? 'question' : 'questions'} available
            </Badge>
          ) : null
        }
        actions={
          <Button to="/aptitude/history" variant="outline" size="sm" iconLeft={<ClockIcon className="w-3.5 h-3.5 text-slate-500" />}>
              Past Attempts
            </Button>
        }
      />

      {/* ── Error Banner ── */}
      {error && (
        <ErrorState
          title="Session Configuration Error"
          message={error}
          onRetry={loadPageData}
        />
      )}

      {/* ── 2. Real Metrics Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Question Bank"
          value={metadata?.totalQuestions !== undefined ? metadata.totalQuestions : '—'}
          subtext="Active placement questions"
          icon={<AptitudeIcon className="w-4 h-4 text-primary" />}
        />
        <StatCard
          label="Past Attempts"
          value={totalAttemptsCount}
          subtext={
            totalAttemptsCount === 0
              ? 'No sessions completed yet'
              : totalAttemptsCount === 1
              ? '1 practice session logged'
              : `${totalAttemptsCount} practice sessions logged`
          }
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
          label="Available Categories"
          value={metadata?.categories?.length || 0}
          subtext={
            (metadata?.categories || []).length > 0
              ? metadata.categories.join(', ')
              : 'Category tracks'
          }
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* ── Loading Skeleton ── */}
      {loading ? (
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-4 w-40 mb-4" />
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <form onSubmit={handleStart} className="space-y-6">
          {/* ── 3. Category Selection Cards ── */}
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4">
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                  1. Select Category
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose the aptitude section you want to target for this assessment session.
                </p>
              </div>

              {(metadata?.categories || []).length === 0 ? (
                <EmptyState
                  title="No categories found"
                  description="No active aptitude categories are currently configured in the database."
                />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {(metadata?.categories || []).map((cat) => {
                    const isSelected = category === cat;
                    const count = getCategoryCount(cat);
                    const meta = CATEGORY_STYLE_DEFAULTS[cat] || {
                      shortName: cat,
                      description: 'Comprehensive aptitude problem bank.',
                    };

                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`group text-left p-4 sm:p-5 rounded-xl border transition-all duration-150 cursor-pointer ${
                          isSelected
                            ? 'border-primary bg-primary-soft ring-2 ring-primary-light/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                        }`}
                      >
                        <div className="flex items-start gap-3.5">
                          <div
                            className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-primary-tint text-primary-dark'
                                : 'bg-slate-100 text-slate-600 group-hover:bg-primary-tint group-hover:text-primary-dark'
                            }`}
                          >
                            <AptitudeIcon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-slate-900 tracking-tight">
                              {meta.shortName}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                              {meta.description}
                            </div>
                            <div className="mt-2.5">
                              <Badge
                                variant={isSelected ? 'brand' : 'default'}
                                size="sm"
                              >
                                {count} {count === 1 ? 'question' : 'questions'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 4. Practice Configuration ── */}
          <Card id="practice-configuration" ref={configFormRef}>
            <CardContent className="p-5 sm:p-6">
              <div className="mb-5">
                <h2 className="text-sm font-semibold text-slate-900 tracking-tight">
                  2. Configure Assessment Parameters
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Customize topic focus, question count, difficulty, and duration.
                  Questions are dynamically sampled from the genuine question bank.
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

              {/* ── Difficulty Question Pool Breakdown ── */}
              {difficultyBreakdown && difficultyBreakdown.total > 0 && (
                <div className="mt-4 pt-3.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-medium">Question Pool for {difficultyBreakdown.scope}:</span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        Easy: {difficultyBreakdown.easy}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                        Medium: {difficultyBreakdown.medium}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-800 border border-rose-200/80">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                        Hard: {difficultyBreakdown.hard}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {difficultyBreakdown.total} available total
                  </span>
                </div>
              )}
            </CardContent>

            {/* ── 5. Start Practice Area & Session Summary ── */}
            <CardFooter className="px-5 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3 text-slate-600 text-xs flex-wrap">
                <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                  <AptitudeIcon className="w-3.5 h-3.5 text-primary" />
                  <span>{category || 'Aptitude'}</span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    {numberOfQuestions}{' '}
                    {numberOfQuestions === 1 ? 'Question' : 'Questions'}
                  </span>
                </div>
                <span className="text-slate-300">·</span>
                <div className="flex items-center gap-1.5">
                  <ClockIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{timeLimitMinutes} Minutes</span>
                </div>
                {difficulty !== 'mixed' && (
                  <>
                    <span className="text-slate-300">·</span>
                    <span className="capitalize text-slate-500 font-medium">
                      {difficulty}
                    </span>
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
                {starting ? 'Preparing Session…' : 'Start Practice'}
              </Button>
            </CardFooter>
          </Card>

          {/* ── 6. Recent Attempt / History Preview ── */}
          <Card>
            <CardHeader className="p-5 sm:p-6 pb-3">
              <div>
                <CardTitle>Recent Attempts</CardTitle>
                <CardDescription>
                  Your latest aptitude practice sessions and performance records.
                </CardDescription>
              </div>
              <Button to="/aptitude/history" variant="ghost" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
                  View All History
                </Button>
            </CardHeader>

            <CardContent className="p-0">
              {recentAttempts.length === 0 ? (
                <div className="p-8 text-center">
                  <EmptyState
                    title="No aptitude attempts yet"
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
                      const isExpired =
                        attempt.status === 'in_progress' &&
                        attempt.timeLimitSeconds &&
                        Date.now() - new Date(attempt.startedAt).getTime() >
                          (attempt.timeLimitSeconds + 30) * 1000;
                      const effectiveStatus = isExpired ? 'expired' : attempt.status;

                      return (
                        <TableRow key={attempt._id}>
                          <TableCell className="text-slate-500 text-xs">
                            <div className="flex items-center gap-1.5">
                              <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                              <span>{dateStr}</span>
                            </div>
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900 text-xs">
                            <div>{attempt.category || 'General Aptitude'}</div>
                            {attempt.topic && attempt.topic !== 'all' && (
                              <div className="text-[11px] text-slate-500 font-normal">
                                {attempt.topic}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize text-xs text-slate-600 font-medium">
                              {attempt.difficulty || 'mixed'}
                            </span>
                          </TableCell>
                          <TableCell className="text-xs text-slate-600 font-mono">
                            {attempt.totalQuestions || 0}{' '}
                            {attempt.totalQuestions === 1 ? 'Q' : 'Qs'}
                          </TableCell>
                          <TableCell className="text-xs">
                            {effectiveStatus === 'in_progress' ? (
                              <span className="text-slate-400 italic">In progress</span>
                            ) : (
                              <div className="font-mono font-bold text-slate-900">
                                {attempt.score || 0} / {attempt.totalQuestions || 0}
                                <span className="ml-1.5 text-[11px] font-normal text-slate-500">
                                  ({attempt.percentage || 0}%)
                                </span>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <StatusBadge status={effectiveStatus} />
                          </TableCell>
                          <TableCell className="text-right">
                            {effectiveStatus === 'in_progress' ? (
                              <Button to={`/aptitude/session/${attempt._id}`} variant="outline" size="sm">
                                  Resume
                                </Button>
                            ) : (
                              <Button to={`/aptitude/result/${attempt._id}`} variant="ghost" size="sm">
                                  Review
                                </Button>
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

          {/* ── 7. Placement Preparation Guidance ── */}
          <Card>
            <CardContent className="p-5 sm:p-6">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-lg bg-primary-tint text-primary-dark flex items-center justify-center shrink-0">
                  <AlertTriangleIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    Assessment Preparation Guidelines
                  </h3>
                  <ul className="mt-2.5 space-y-2 text-xs text-slate-600 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>
                        <strong>Dynamic Question Sampling:</strong> Questions are sampled directly from the genuine placement question bank. Every session generates a focused question set.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>
                        <strong>Strict Timed Conditions:</strong> The session timer runs continuously once questions load. Practice answering within allocated pacing boundaries.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>
                        <strong>Verified Solutions & Explanations:</strong> Comprehensive step-by-step solutions and verified explanations become accessible immediately upon test submission.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-slate-400 mt-0.5 shrink-0">•</span>
                      <span>
                        <strong>Persistent Attempt History:</strong> All scores, accuracy metrics, and review breakdowns are preserved in your past attempts for diagnostic analysis.
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
