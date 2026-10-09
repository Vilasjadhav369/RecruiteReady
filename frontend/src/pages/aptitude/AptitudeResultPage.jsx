import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
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
  ProgressBar,
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

/**
 * Defensive option sanitizer to prevent duplicate option keys or entries from rendering.
 */
function sanitizeReviewOptions(options) {
  if (!Array.isArray(options)) return [];
  const seenKeys = new Set();
  const sanitized = [];

  for (const opt of options) {
    if (!opt || !opt.key) continue;
    const key = String(opt.key).trim().toUpperCase();
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      sanitized.push({
        key,
        text: String(opt.text || '').trim(),
      });
    }
  }

  return sanitized;
}

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

  // Compute 100% genuine topic breakdown from actual question reviews
  const topicBreakdown = useMemo(() => {
    if (!result?.review || result.review.length === 0) return [];

    const map = new Map();
    for (const q of result.review) {
      const topicName = q.topic || q.category || 'General';
      if (!map.has(topicName)) {
        map.set(topicName, {
          name: topicName,
          total: 0,
          correct: 0,
          wrong: 0,
          unanswered: 0,
        });
      }
      const item = map.get(topicName);
      item.total++;
      if (!q.selectedOption) {
        item.unanswered++;
      } else if (q.isCorrect) {
        item.correct++;
      } else {
        item.wrong++;
      }
    }

    return Array.from(map.values()).map((t) => ({
      ...t,
      percentage: t.total > 0 ? Math.round((t.correct / t.total) * 100) : 0,
    }));
  }, [result?.review]);

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-6 sm:space-y-7 pb-10">
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
      <div className="max-w-md mx-auto pt-16 px-4">
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

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 sm:space-y-7 pb-10">
      {/* ── Page Header ── */}
      <PageHeader
        title="Assessment Results"
        description={`${summary.category || 'Aptitude Practice'} — ${summary.topic || 'Mixed Topics'} (${(summary.difficulty || 'mixed').toLowerCase()} difficulty)`}
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Aptitude', to: '/aptitude' },
          { label: 'Result' },
        ]}
        badge={
          <Badge
            variant={isPassed ? 'brand' : 'warning'}
            size="sm"
            dot
          >
            {isPassed ? 'Ready / Passing' : 'Needs Practice'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button to="/aptitude" variant="primary" size="sm" iconLeft={<PlusIcon className="w-3.5 h-3.5" />}>
                New Practice
              </Button>
            <Button to="/aptitude/history" variant="outline" size="sm" iconLeft={<ClockIcon className="w-3.5 h-3.5 text-slate-500" />}>
                All History
              </Button>
          </div>
        }
      />

      {/* ── Score Summary Metrics Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label="Score"
          value={summary.score || 0}
          subtext="Total marks"
          icon={<TrophyIcon className="w-4 h-4 text-primary" />}
        />
        <StatCard
          label="Accuracy"
          value={`${summary.percentage || 0}%`}
          subtext="Overall accuracy"
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
          subtext="Wrong answers"
          icon={<CloseIcon className="w-4 h-4 text-red-600" />}
        />
        <StatCard
          label="Unanswered"
          value={summary.unanswered || 0}
          subtext="Skipped questions"
        />
      </div>

      {/* ── Genuine Topic Performance Breakdown ── */}
      <Card>
        <CardHeader className="p-5 sm:p-6 pb-3 border-b border-slate-100">
          <div>
            <CardTitle>Topic Performance Breakdown</CardTitle>
            <CardDescription>
              Real accuracy and question distribution across topics evaluated in this session.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-5 sm:p-6">
          {topicBreakdown.length === 0 ? (
            <p className="text-xs text-slate-500 py-3 text-center">
              No topic performance data available for this session.
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {topicBreakdown.map((t) => (
                <div
                  key={t.name}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {t.name}
                    </span>
                    <Badge
                      variant={t.percentage >= 70 ? 'brand' : t.percentage >= 40 ? 'warning' : 'default'}
                      size="sm"
                    >
                      {t.percentage}%
                    </Badge>
                  </div>

                  <ProgressBar
                    value={t.percentage}
                    variant={t.percentage >= 70 ? 'primary' : 'warning'}
                    size="sm"
                  />

                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                    <span>
                      {t.correct} of {t.total} {t.total === 1 ? 'question' : 'questions'}
                    </span>
                    <span>
                      {t.wrong} wrong · {t.unanswered} skipped
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Detailed Question Review & Complete Explanations ── */}
      <Card>
        <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Question Review & Complete Solutions</CardTitle>
            <CardDescription>
              Step-by-step explanations and verified solution walkthroughs for each question.
            </CardDescription>
          </div>
          <span className="text-xs font-bold text-slate-900 font-mono">
            {review?.length || 0} Questions Evaluated
          </span>
        </CardHeader>

        <CardContent className="divide-y divide-slate-100 p-0">
          {(review || []).map((item, idx) => {
            const isAnswered = Boolean(item.selectedOption);
            const isCorrect = item.isCorrect;
            const options = sanitizeReviewOptions(item.options);

            return (
              <div key={item.questionId || idx} className="p-5 sm:p-7 space-y-4">
                {/* Question Metadata Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 text-slate-900 text-xs font-bold font-mono">
                      Q{idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-slate-700">
                      {item.topic || item.category}
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="text-xs capitalize text-slate-500 font-medium">
                      {item.difficulty}
                    </span>
                  </div>

                  <div>
                    {!isAnswered ? (
                      <Badge variant="default" size="sm">
                        Not Answered
                      </Badge>
                    ) : isCorrect ? (
                      <Badge variant="brand" size="sm" dot>
                        Correct (+{item.marks || 1} {item.marks === 1 ? 'mark' : 'marks'})
                      </Badge>
                    ) : (
                      <Badge variant="danger" size="sm" dot>
                        Incorrect (0 marks)
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Question Text */}
                <div className="text-sm sm:text-base font-semibold text-slate-900 leading-relaxed whitespace-pre-line">
                  {item.question}
                </div>

                {/* Options List with High-Clarity Distinction */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {options.map((opt) => {
                    const isUserPick = item.selectedOption === opt.key;
                    const isRightAnswer = item.correctOption === opt.key;

                    let optionBorder = 'border-slate-200 bg-white text-slate-700';
                    if (isRightAnswer) {
                      optionBorder =
                        'border-[#22C55E] bg-[#F0FDF4] text-primary-dark font-medium shadow-xs';
                    } else if (isUserPick && !isRightAnswer) {
                      optionBorder =
                        'border-red-300 bg-red-50/70 text-red-950 font-medium';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition-colors ${optionBorder}`}
                      >
                        <span
                          className={`font-mono font-bold w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                            isRightAnswer
                              ? 'bg-primary text-white'
                              : isUserPick
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span className="flex-1 leading-snug pt-0.5">{opt.text}</span>
                        {isRightAnswer && (
                          <Badge variant="brand" size="sm">
                            Correct Answer
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

                {/* Full Solution & Explanation (Never Truncated) */}
                <div className="p-4 bg-slate-50 border border-slate-200/90 rounded-xl text-xs space-y-1.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    <InfoIcon className="w-4 h-4 text-primary" />
                    <span>Explanation & Verified Solution:</span>
                  </div>
                  <div className="text-slate-700 leading-relaxed pl-5.5 whitespace-pre-line">
                    {item.explanation
                      ? item.explanation
                      : 'No explanation is available for this question yet.'}
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
