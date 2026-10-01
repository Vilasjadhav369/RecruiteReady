import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAptitudeResult } from '../../services/aptitudeService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Button,
  StatCard,
  Skeleton,
  SkeletonCard,
  ErrorState,
  CheckCircleIcon,
  CloseIcon,
  InfoIcon,
  TrophyIcon,
  ClockIcon,
  PlusIcon,
} from '../../components/ui/index.js';

export default function AptitudeResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResult = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAptitudeResult(id);
      setResult(data);
    } catch (err) {
      console.error('Failed to load result:', err);
      setError(err.response?.data?.message || 'Failed to load test results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </Card>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <Card className="p-6 space-y-4">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-24 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <ErrorState
          title="Result Not Found"
          message={error || 'Unable to retrieve test score summary.'}
          onRetry={fetchResult}
        />
      </div>
    );
  }

  const { summary, review } = result;
  const isPassed = (summary.percentage || 0) >= 60;
  const submittedDate = summary.submittedAt
    ? new Date(summary.submittedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Recently';

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Assessment Results"
        description={`${summary.category} — ${summary.topic} (${summary.difficulty || 'mixed'} difficulty)`}
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Aptitude', to: '/aptitude' },
          { label: 'History', to: '/aptitude/history' },
          { label: 'Result' },
        ]}
        badge={
          <Badge
            variant={isPassed ? 'success' : 'warning'}
            size="sm"
            dot
          >
            {isPassed ? 'Ready / Passing' : 'Needs Practice'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Link to="/aptitude">
              <Button
                variant="primary"
                size="sm"
                iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
              >
                New Session
              </Button>
            </Link>
            <Link to="/aptitude/history">
              <Button
                variant="outline"
                size="sm"
                iconLeft={<ClockIcon className="w-3.5 h-3.5" />}
              >
                All History
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Score Summary Metrics Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Score"
          value={summary.score || 0}
          subtext="Points scored"
          icon={<TrophyIcon className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          label="Accuracy"
          value={`${summary.percentage || 0}%`}
          subtext="Percentage"
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Total Questions"
          value={summary.totalQuestions || 0}
          subtext="In this test"
        />
        <StatCard
          label="Correct"
          value={summary.correctAnswers || 0}
          subtext="Correct answers"
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Incorrect"
          value={summary.wrongAnswers || 0}
          subtext="Incorrect answers"
          icon={<CloseIcon className="w-4 h-4 text-red-600" />}
        />
        <StatCard
          label="Skipped"
          value={summary.unanswered || 0}
          subtext="Unanswered"
        />
      </div>

      {/* ── Detailed Question Review ── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Detailed Answer Review</CardTitle>
            <CardDescription>
              Step-by-step solutions and verified explanations for each question in this session.
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {review?.length || 0} Questions Evaluated
          </span>
        </CardHeader>

        <CardContent className="divide-y divide-slate-100 p-0">
          {(review || []).map((item, idx) => {
            const isAnswered = Boolean(item.selectedOption);
            const isCorrect = item.isCorrect;

            return (
              <div key={item.questionId} className="p-6 space-y-4">
                {/* Question Metadata Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold font-mono">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {item.topic} · <span className="capitalize">{item.difficulty}</span>
                    </span>
                  </div>

                  <div>
                    {!isAnswered ? (
                      <Badge variant="default" size="sm">
                        Unanswered
                      </Badge>
                    ) : isCorrect ? (
                      <Badge variant="success" size="sm" dot>
                        Correct (+{item.marks} {item.marks === 1 ? 'mark' : 'marks'})
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm" dot>
                        Incorrect (0 marks)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-sm font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                  {item.question}
                </div>

                {/* Options List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {(item.options || []).map((opt) => {
                    const isUserPick = item.selectedOption === opt.key;
                    const isRightAnswer = item.correctOption === opt.key;

                    let optionBorder = 'border-slate-200 bg-white text-slate-700';
                    if (isRightAnswer) {
                      optionBorder = 'border-emerald-300 bg-emerald-50/70 text-emerald-950 font-medium';
                    } else if (isUserPick && !isRightAnswer) {
                      optionBorder = 'border-red-300 bg-red-50/70 text-red-950 font-medium';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-3 transition-colors ${optionBorder}`}
                      >
                        <span className="font-bold font-mono shrink-0 pt-0.5">{opt.key}.</span>
                        <span className="flex-1 leading-snug">{opt.text}</span>
                        {isRightAnswer && (
                          <Badge variant="success" size="sm">
                            Correct
                          </Badge>
                        )}
                        {isUserPick && !isRightAnswer && (
                          <Badge variant="danger" size="sm">
                            Your Choice
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Solution Explanation Box */}
                {item.explanation && (
                  <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl text-xs space-y-1.5">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <InfoIcon className="w-4 h-4 text-blue-600" />
                      <span>Explanation & Solution:</span>
                    </div>
                    <div className="text-slate-600 leading-relaxed pl-5.5">
                      {item.explanation}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
