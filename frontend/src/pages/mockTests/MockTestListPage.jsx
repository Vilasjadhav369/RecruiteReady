import React, { useState, useEffect } from 'react';
import { useFeedback } from '../../components/ui/FeedbackProvider.jsx';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getMockTests, startMockTest } from '../../services/mockTestService.js';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  StatusBadge,
  Button,
  LoadingState,
  ErrorState,
  EmptyState
} from '../../components/ui/index.js';
import { 
  ClockIcon, 
  DocumentIcon,
  ArrowRightIcon,
  EyeIcon,
  TrophyIcon
} from '../../components/ui/Icons.jsx';

export default function MockTestListPage() {
  const { notify } = useFeedback();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const companyParam = searchParams.get('company');

  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  const fetchTests = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedDifficulty !== 'all') params.difficulty = selectedDifficulty;
      if (companyParam) params.company = companyParam;

      const data = await getMockTests(params);
      setTests(data?.mockTests || []);
    } catch (err) {
      console.error('Failed to load mock tests:', err);
      setError('Failed to load mock assessments. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [selectedCategory, selectedDifficulty, companyParam]);

  const handleStart = async (testId) => {
    if (startingId) return;
    try {
      setStartingId(testId);
      const data = await startMockTest(testId);
      if (data?.attemptId) {
        navigate(`/mock-tests/session/${data.attemptId}`);
      }
    } catch (err) {
      console.error('Failed to start mock test:', err);
      notify({ variant: 'error', title: 'Unable to start test', message: err.response?.data?.message || 'Could not start this test. Please try again.' });
    } finally {
      setStartingId(null);
    }
  };

  const getDifficultyVariant = (difficulty) => {
    const diff = (difficulty || '').toLowerCase();
    if (diff === 'easy') return 'success';
    if (diff === 'hard') return 'danger';
    return 'warning';
  };

  // Derive unique categories from fetched tests
  const allCategories = ['all'];
  tests.forEach((t) => {
    (t.categories || []).forEach((cat) => {
      if (!allCategories.includes(cat)) allCategories.push(cat);
    });
  });

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Mock Tests"
        description="Simulate real placement assessments and measure your readiness under timed conditions."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Mock Tests' },
        ]}
        actions={
          <Button to="/mock-tests/history" variant="outline" size="sm" iconLeft={<ClockIcon className="w-4 h-4" />}>
              Attempt History
            </Button>
        }
      />

      {/* ── Filters Bar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white rounded-xl border border-slate-200">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0 mr-1">
            Topic:
          </span>
          {allCategories.slice(0, 5).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedCategory === cat
                  ? 'bg-brand text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'all' ? 'All Topics' : cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 shrink-0">
            Level:
          </span>
          {['all', 'easy', 'medium', 'hard'].map((diff) => (
            <button
              key={diff}
              onClick={() => setSelectedDifficulty(diff)}
              className={`px-2.5 py-1 rounded-lg text-xs capitalize transition-colors ${
                selectedDifficulty === diff
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {diff}
            </button>
          ))}
        </div>
      </div>

      {/* ── Active Company Filter Pill ── */}
      {companyParam && (
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-800">Filtered for company track:</span>
            <span className="font-mono bg-white px-2 py-0.5 rounded border border-sky-300 text-sky-950 font-bold">{companyParam}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const nextParams = new URLSearchParams(searchParams);
              nextParams.delete('company');
              setSearchParams(nextParams);
            }}
            className="text-sky-700 hover:text-sky-900 font-semibold underline cursor-pointer"
          >
            Show all mock tests
          </button>
        </div>
      )}

      {/* ── Assessments Feed ── */}
      {loading ? (
        <LoadingState message="Loading placement mock assessments..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTests} />
      ) : tests.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon className="w-8 h-8 text-slate-400" />}
          title="No mock tests available yet"
          description="Full-length timed assessments will be published here by the placement committee."
          action={
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {tests.map((test) => {
            const userAttempt = test.userAttempt;
            const isInProgress = userAttempt?.status === 'in_progress';
            const isCompleted = userAttempt?.status === 'submitted';
            const isExpired = userAttempt?.status === 'expired';

            return (
              <Card 
                key={test._id}
                className="transition-all hover:border-slate-300 hover:shadow-xs"
              >
                <CardContent className="p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  <div className="space-y-3.5 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge variant={getDifficultyVariant(test.difficulty)}>
                        {test.difficulty || 'Medium'}
                      </Badge>

                      {test.company && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-50 text-sky-800 border border-sky-200">
                          {test.company.name || 'Company Mock'}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{test.durationMinutes} Minutes</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <DocumentIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{test.totalQuestions || 0} Questions</span>
                        </div>
                      </div>

                      {/* Status indicator */}
                      {isInProgress ? (
                        <StatusBadge status="in progress" />
                      ) : isCompleted ? (
                        <StatusBadge status="completed" />
                      ) : isExpired ? (
                        <StatusBadge status="expired" />
                      ) : (
                        <Badge variant="default" size="sm">Not Started</Badge>
                      )}
                    </div>

                    <div>
                      <h3
                        onClick={() => navigate(`/mock-tests/${test._id}`)}
                        className="text-base sm:text-lg font-bold text-slate-900 tracking-tight hover:text-brand-dark cursor-pointer transition-colors hover:underline"
                      >
                        {test.title}
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed mt-1">
                        {test.description || 'Comprehensive campus recruitment assessment modeled on standard industry testing patterns.'}
                      </p>
                    </div>

                    {/* Syllabus Tags */}
                    {test.categories && test.categories.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {test.categories.map((cat, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200"
                          >
                            {cat}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Previous Performance Summary if attempted */}
                    {userAttempt && (isCompleted || isExpired) && (
                      <div className="flex items-center gap-2 pt-1 text-xs text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-200 w-fit">
                        <TrophyIcon className="w-3.5 h-3.5 text-brand" />
                        <span>
                          Previous Score:{' '}
                          <strong className="text-slate-900 font-bold">
                            {userAttempt.score}
                          </strong>{' '}
                          ({userAttempt.percentage}%) • {userAttempt.correctAnswers}/{userAttempt.totalQuestions} Correct
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions Column */}
                  <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row items-stretch lg:items-center gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/mock-tests/${test._id}`)}
                      className="w-full sm:w-auto"
                    >
                      Details
                    </Button>

                    {isInProgress ? (
                      <Button
                        variant="primary"
                        size="sm"
                        iconRight={<ArrowRightIcon className="w-4 h-4" />}
                        onClick={() => navigate(`/mock-tests/session/${userAttempt._id}`)}
                        className="w-full sm:w-auto"
                      >
                        Resume Test
                      </Button>
                    ) : (isCompleted || isExpired) ? (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          iconLeft={<EyeIcon className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/mock-tests/result/${userAttempt._id}`)}
                          className="w-full sm:w-auto"
                        >
                          View Result
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          disabled={startingId === test._id}
                          loading={startingId === test._id}
                          onClick={() => handleStart(test._id)}
                          className="w-full sm:w-auto"
                        >
                          Retake Test
                        </Button>
                      </>
                    ) : (
                      <Button
                        variant="primary"
                        size="sm"
                        disabled={startingId === test._id}
                        loading={startingId === test._id}
                        iconRight={<ArrowRightIcon className="w-4 h-4" />}
                        onClick={() => handleStart(test._id)}
                        className="w-full sm:w-auto"
                      >
                        {startingId === test._id ? 'Starting...' : 'Start Test'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
