import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getMockTest, startMockTest } from '../../services/mockTestService.js';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  StatusBadge,
  Button,
  StatCard,
  LoadingState,
  ErrorState,
} from '../../components/ui/index.js';
import {
  ClockIcon,
  DocumentIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ShieldCheckIcon,
  AcademicCapIcon,
  CheckCircleIcon,
  EyeIcon,
  TrophyIcon,
} from '../../components/ui/Icons.jsx';

export default function MockTestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [userAttempt, setUserAttempt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const data = await getMockTest(id);
        if (!data?.test) {
          setError('Assessment not found or is currently unpublished.');
        } else {
          setTest(data.test);
          setUserAttempt(data.userAttempt || null);
        }
      } catch (err) {
        console.error('Failed to load mock test detail:', err);
        setError(err.response?.data?.message || 'Failed to load assessment details.');
      } finally {
        setLoading(false);
      }
    };
    fetchTest();
  }, [id]);

  const handleStart = async () => {
    if (starting) return;
    try {
      setStarting(true);
      const data = await startMockTest(id);
      if (data?.attemptId) {
        navigate(`/mock-tests/session/${data.attemptId}`);
      }
    } catch (err) {
      console.error('Failed to start mock test:', err);
      alert(err.response?.data?.message || 'Could not start this test.');
    } finally {
      setStarting(false);
    }
  };

  const getDifficultyVariant = (difficulty) => {
    const diff = (difficulty || '').toLowerCase();
    if (diff === 'easy') return 'success';
    if (diff === 'hard') return 'danger';
    return 'warning';
  };

  if (loading) {
    return <LoadingState message="Loading assessment overview..." />;
  }

  if (error || !test) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <ErrorState
          title="Assessment Unavailable"
          message={error || 'The requested test could not be located.'}
          onRetry={() => navigate('/mock-tests')}
        />
      </div>
    );
  }

  const isInProgress = userAttempt?.status === 'in_progress';
  const isCompleted = userAttempt?.status === 'submitted';
  const isExpired = userAttempt?.status === 'expired';

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* ── Page Header ── */}
      <PageHeader
        title={test.title}
        description={test.description || 'Full-length timed evaluation modeled after actual recruitment patterns.'}
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Mock Tests', to: '/mock-tests' },
          { label: test.title },
        ]}
        actions={
          <Link to="/mock-tests">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<ChevronLeftIcon className="w-4 h-4" />}
            >
              All Assessments
            </Button>
          </Link>
        }
      />

      {/* ── Key Metrics Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Duration"
          value={`${test.durationMinutes || 0}m`}
          subtext="Total exam window"
          icon={<ClockIcon className="w-4 h-4 text-brand-dark" />}
        />
        <StatCard
          label="Questions"
          value={test.totalQuestions || 0}
          subtext="Multiple choice questions"
          icon={<DocumentIcon className="w-4 h-4 text-slate-600" />}
        />
        <StatCard
          label="Difficulty"
          value={test.difficulty ? test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1) : 'Medium'}
          subtext="Assessment rating"
          icon={<AcademicCapIcon className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Environment"
          value="Timed"
          subtext="Server-monitored"
          icon={<ShieldCheckIcon className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* ── Assessment Guidelines & CTA Card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left 2 Cols: Guidelines & Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Instructions & Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 text-sm text-slate-600 leading-relaxed">
              {test.instructions && (
                <div className="whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 text-xs sm:text-sm font-medium">
                  {test.instructions}
                </div>
              )}

              <div className="space-y-3.5 pt-1">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 font-semibold">Continuous server-side timer:</strong> The clock starts immediately upon session initialization. Do not refresh or navigate away from the exam tab.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 font-semibold">Real-time answer persistence:</strong> Your selected choices are saved to the server as you answer each question.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 font-semibold">Question palette navigation:</strong> You can skip, review, and toggle questions for review before submitting your paper.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-900 font-semibold">Automatic submission on expiry:</strong> When remaining time reaches zero, the assessment is automatically finalized and evaluated.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right 1 Col: Session Control Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <Badge variant={getDifficultyVariant(test.difficulty)}>
                  {test.difficulty || 'Medium'}
                </Badge>
                <span className="text-xs text-slate-500 font-mono">
                  {test.durationMinutes} min window
                </span>
              </div>
              <CardTitle className="text-base mt-2">{test.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {/* Syllabus / Topics */}
              {test.categories && test.categories.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Syllabus Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {test.categories.map((cat, idx) => (
                      <span 
                        key={idx} 
                        className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Alert if attempt exists */}
              {isInProgress ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <StatusBadge status="in progress" />
                    <span>Active Session Detected</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-normal">
                    You have an active exam in progress. Resuming will bring you back to your questions.
                  </p>
                </div>
              ) : (isCompleted || isExpired) ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <TrophyIcon className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Previous Result: {userAttempt.percentage}%</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-normal">
                    Score: {userAttempt.score} • {userAttempt.correctAnswers}/{userAttempt.totalQuestions} Correct
                  </p>
                </div>
              ) : null}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                {isInProgress ? (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    iconRight={<ArrowRightIcon className="w-4 h-4" />}
                    onClick={() => navigate(`/mock-tests/session/${userAttempt._id}`)}
                  >
                    Resume Assessment
                  </Button>
                ) : (isCompleted || isExpired) ? (
                  <>
                    <Button
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={starting}
                      disabled={starting}
                      iconRight={<ArrowRightIcon className="w-4 h-4" />}
                      onClick={handleStart}
                    >
                      {starting ? 'Initializing...' : 'Retake Assessment'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      fullWidth
                      iconLeft={<EyeIcon className="w-4 h-4" />}
                      onClick={() => navigate(`/mock-tests/result/${userAttempt._id}`)}
                    >
                      View Past Result
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={starting}
                    disabled={starting}
                    iconRight={<ArrowRightIcon className="w-4 h-4" />}
                    onClick={handleStart}
                  >
                    {starting ? 'Starting Test...' : 'Begin Assessment'}
                  </Button>
                )}
              </div>

              <p className="text-center text-xs text-slate-400">
                Session timer starts immediately on launch.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
