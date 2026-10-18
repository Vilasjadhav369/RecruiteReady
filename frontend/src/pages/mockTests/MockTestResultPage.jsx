import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMockResult } from '../../services/mockTestService.js';
import { formatDateTime } from '../../utils/formatters.js';
import { useCelebrateOnce } from '../../hooks/useCelebrate.js';
import { AnimatedNumber } from '../../components/ui/AnimatedNumber.jsx';
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
  ErrorState 
} from '../../components/ui/index.js';
import { 
  TrophyIcon, 
  ChartBarIcon, 
  DocumentIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  ChevronLeftIcon,
  SparklesIcon
} from '../../components/ui/Icons.jsx';

export default function MockTestResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [showReview, setShowReview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getMockResult(id);
        setResult(data);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError(err.response?.data?.message || 'Failed to load assessment report.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  // Celebrate once, only when the existing 70% pass line is met
  useCelebrateOnce(`mock-${id}`, (result?.summary?.percentage || 0) >= 70);

  if (loading) {
    return <LoadingState message="Evaluating mock test scorecard..." />;
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <ErrorState 
          title="Result Unavailable" 
          message={error || 'Test results could not be located.'}
          onRetry={() => navigate('/mock-tests')}
        />
      </div>
    );
  }

  const { summary, review } = result;
  const isPassing = (summary.percentage || 0) >= 70;

  return (
    <div className="space-y-8 max-w-[1240px] mx-auto">
      {/* ── Page Header ── */}
      <PageHeader 
        title={summary.testTitle || 'Mock Assessment Report'}
        description={`Assessment completed on ${formatDateTime(summary.submittedAt || summary.startedAt)}`}
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Mock Tests', to: '/mock-tests' },
          { label: 'Result' }
        ]}
        badge={
          <StatusBadge status={summary.status} />
        }
        actions={
          <div className="flex items-center gap-2.5">
            <Button type="button" variant="outline" size="sm" className="rr-no-print" onClick={() => window.print()}>
              Print / PDF
            </Button>
            <Button to="/mock-tests/history" variant="outline" size="sm" iconLeft={<ClockIcon className="w-4 h-4" />}>
                Attempt History
              </Button>
            <Button to="/mock-tests" variant="primary" size="sm" iconLeft={<ChevronLeftIcon className="w-4 h-4" />}>
                All Assessments
              </Button>
          </div>
        }
      />

      {/* ── Overview Feedback Banner ── */}
      <Card className={`p-6 border ${isPassing ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SparklesIcon className={`w-5 h-5 ${isPassing ? 'text-brand' : 'text-slate-500'}`} />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isPassing
                  ? 'Strong Readiness Performance'
                  : 'Practice Complete — Detailed Walkthrough Below'}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-600">
              {isPassing
                ? 'Your score demonstrates strong conceptual command under timed test pressure.'
                : 'Review each question and explanation below to target your conceptual gaps.'}
            </p>
          </div>

          <div className="flex items-baseline gap-2 shrink-0 bg-white px-4 py-2 rounded-xl border border-slate-200">
            <span className="text-2xl font-black text-slate-900 font-mono">
              <AnimatedNumber value={summary.percentage || 0} />%
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Overall Accuracy
            </span>
          </div>
        </div>
      </Card>

      {/* ── Detailed Metrics Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          label="Score" 
          value={summary.score ?? 0} 
          subtext="Marks earned"
          icon={<TrophyIcon className="w-4 h-4 text-brand-dark" />} 
        />
        <StatCard 
          label="Accuracy" 
          value={`${summary.percentage ?? 0}%`} 
          subtext="Percentage score"
          icon={<ChartBarIcon className="w-4 h-4 text-emerald-600" />} 
        />
        <StatCard 
          label="Questions" 
          value={summary.totalQuestions ?? 0} 
          subtext="Total on paper"
          icon={<DocumentIcon className="w-4 h-4 text-slate-600" />} 
        />
        <StatCard 
          label="Correct" 
          value={summary.correctAnswers ?? 0} 
          subtext="Passed validation"
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />} 
        />
        <StatCard 
          label="Incorrect" 
          value={summary.wrongAnswers ?? 0} 
          subtext="Wrong options"
          icon={<XCircleIcon className="w-4 h-4 text-rose-600" />} 
        />
        <StatCard 
          label="Unanswered" 
          value={summary.unanswered ?? 0} 
          subtext="Left blank"
          icon={<ClockIcon className="w-4 h-4 text-slate-400" />} 
        />
      </div>

      {/* ── Question Review & Walkthrough ── */}
      <Card>
        <CardHeader className="border-b border-slate-100">
          <div>
            <CardTitle>Detailed Answer Walkthrough</CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your answers alongside official explanations and key insights.
            </p>
          </div>
        </CardHeader>
                <button
          type="button"
          onClick={() => setShowReview((v) => !v)}
          aria-expanded={showReview}
          className="rr-no-print w-full flex items-center justify-between px-5 sm:px-6 py-3 text-sm font-semibold text-slate-900 hover:bg-slate-50 cursor-pointer transition-colors"
        >
          <span>{showReview ? 'Hide' : 'Show'} full question-by-question review</span>
          <svg className={`w-4 h-4 text-slate-500 transition-transform ${showReview ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M5 8l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <CardContent className="rr-review p-6" hidden={!showReview}>
          <div className="space-y-8 divide-y divide-slate-100">
            {(review || []).map((item, idx) => {
              const isUserCorrect = Boolean(item.isCorrect);
              const hasAttempted = Boolean(item.selectedOption);

              return (
                <div key={item.questionId || idx} className={idx > 0 ? 'pt-8' : ''}>
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        Question {idx + 1}
                      </span>
                      <Badge variant="default" size="sm">
                        {item.topic || item.category || 'General'}
                      </Badge>
                    </div>

                    {isUserCorrect ? (
                      <Badge variant="success" size="sm">Correct (+1)</Badge>
                    ) : hasAttempted ? (
                      <Badge variant="danger" size="sm">Incorrect (0)</Badge>
                    ) : (
                      <Badge variant="warning" size="sm">Not Answered</Badge>
                    )}
                  </div>

                  <p className="text-sm sm:text-base font-medium text-slate-900 mb-5 leading-relaxed whitespace-pre-line">
                    {item.question}
                  </p>

                  {/* Options List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
                    {(item.options || []).map((opt) => {
                      const isUserPick = item.selectedOption === opt.key;
                      const isRightAnswer = item.correctOption === opt.key;

                      let cardClass = 'border-slate-200 bg-white text-slate-800';
                      let badgeVariant = 'default';

                      if (isRightAnswer) {
                        cardClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                        badgeVariant = 'success';
                      } else if (isUserPick && !isRightAnswer) {
                        cardClass = 'border-rose-400 bg-rose-50 text-rose-950 font-semibold ring-1 ring-rose-400';
                        badgeVariant = 'danger';
                      }

                      return (
                        <div
                          key={opt.key}
                          className={`p-3.5 rounded-xl border text-xs sm:text-sm flex items-start gap-3 transition-colors ${cardClass}`}
                        >
                          <Badge variant={badgeVariant} size="sm" className="shrink-0 font-mono font-bold">
                            {opt.key}
                          </Badge>
                          <span className="flex-1 leading-snug pt-0.5">
                            {opt.text}
                          </span>
                          {isRightAnswer && (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              Correct
                            </span>
                          )}
                          {isUserPick && !isRightAnswer && (
                            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                              Your Answer
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-700 space-y-1">
                    <span className="font-semibold text-slate-900 block">
                      Explanation:
                    </span>
                    <p className="leading-relaxed whitespace-pre-line text-slate-600">
                      {item.explanation || 'No explanation is available for this question yet.'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
