import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMockTest, startMockTest } from '../../services/mockTestService.js';
import {
  PageHeader,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
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
} from '../../components/ui/Icons.jsx';

export default function MockTestDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const data = await getMockTest(id);
        if (!data) {
          setError('Assessment not found or is currently unpublished.');
        } else {
          setTest(data);
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
    if (diff === 'easy') return 'default';
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

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      <PageHeader
        title={test.title}
        description={test.description || 'Full-length timed evaluation modeled after actual recruitment patterns.'}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mock Assessments', href: '/mock-tests' },
          { label: test.title },
        ]}
        actions={
          <Button
            variant="outline"
            iconLeft={<ChevronLeftIcon className="w-4 h-4" />}
            onClick={() => navigate('/mock-tests')}
          >
            All Assessments
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Duration"
          value={`${test.durationMinutes || 0}m`}
          subtext="Total exam time"
          icon={<ClockIcon className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          label="Questions"
          value={test.totalQuestions || 0}
          subtext="Multiple choice & coding"
          icon={<DocumentIcon className="w-4 h-4 text-slate-600" />}
        />
        <StatCard
          label="Difficulty"
          value={test.difficulty || 'Medium'}
          subtext="Relative level"
          icon={<AcademicCapIcon className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Environment"
          value="Timed"
          subtext="Server-monitored"
          icon={<ShieldCheckIcon className="w-4 h-4 text-emerald-600" />}
        />
      </div>

      {/* Assessment Specifications & Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assessment Instructions & Guidelines</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-600 leading-relaxed">
              {test.instructions ? (
                <div className="whitespace-pre-line bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800">
                  {test.instructions}
                </div>
              ) : null}

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-800 font-semibold">One-sitting assessment:</strong> The timer runs continuously once started. Do not close or refresh your browser tab.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-800 font-semibold">Continuous answer autosave:</strong> Selected choices and progress are saved to the server as you answer.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-800 font-semibold">Question palette navigation:</strong> You can review, skip, or mark questions for review anytime before submission.
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircleIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-slate-800 font-semibold">Auto-submission:</strong> When remaining time expires, the assessment will be automatically evaluated.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Start Assessment Action Card */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="border-blue-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <Badge variant={getDifficultyVariant(test.difficulty)}>
                  {test.difficulty || 'Medium'}
                </Badge>
                <span className="text-xs text-slate-500 font-medium">
                  {test.durationMinutes} min limit
                </span>
              </div>
              <CardTitle className="text-lg mt-2">{test.title}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              {test.categories && test.categories.length > 0 && (
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
                    Syllabus / Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {test.categories.map((cat, idx) => (
                      <Badge key={idx} variant="default">
                        {cat}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2">
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
              </div>

              <p className="text-center text-xs text-slate-400">
                Clicking will initialize your test session immediately.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
