import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAptitudeSession,
  saveAptitudeAnswer,
  submitAptitudeSession,
} from '../../services/aptitudeService.js';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Modal,
  Skeleton,
  ErrorState,
  ClockIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  CheckIcon,
  AlertTriangleIcon,
} from '../../components/ui/index.js';

/**
 * Defensive option sanitizer to prevent duplicate option keys or entries from rendering.
 */
function sanitizeQuestionOptions(options) {
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

export default function AptitudeSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [markedForReview, setMarkedForReview] = useState(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Guards against race conditions or multiple submissions
  const isSubmittingRef = useRef(false);
  const timerRef = useRef(null);

  // Auto-submit callback with single-submission lock
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      await submitAptitudeSession(id);
      navigate(`/aptitude/result/${id}`, { replace: true });
    } catch (err) {
      console.error('Auto-submit error:', err);
      navigate(`/aptitude/result/${id}`, { replace: true });
    }
  }, [id, navigate]);

  // Load session state
  useEffect(() => {
    let isMounted = true;
    const fetchSession = async () => {
      try {
        setLoading(true);
        const data = await getAptitudeSession(id);
        if (!isMounted) return;

        if (data?.attempt?.status === 'submitted' || data?.attempt?.status === 'expired') {
          navigate(`/aptitude/result/${id}`, { replace: true });
          return;
        }

        setAttempt(data.attempt);
        setQuestions(data.questions || []);
        setRemainingSeconds(data.attempt.remainingSeconds || 0);

        // Prepopulate saved answers
        const ansMap = {};
        (data.attempt.answers || []).forEach((a) => {
          if (a.selectedOption) {
            ansMap[a.questionId] = a.selectedOption;
          }
        });
        setSelectedAnswers(ansMap);
      } catch (err) {
        console.error('Failed to load session:', err);
        setError(err.response?.data?.message || 'Failed to load session. Please return to practice.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSession();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  // Timer countdown
  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, remainingSeconds, handleAutoSubmit]);

  const handleSelectOption = async (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || isSubmittingRef.current) return;

    const newOption = selectedAnswers[currentQ._id] === optionKey ? '' : optionKey;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ._id]: newOption }));

    // Persist in background asynchronously without blocking UI
    try {
      await saveAptitudeAnswer(id, {
        questionId: currentQ._id,
        selectedOption: newOption,
      });
    } catch (err) {
      console.error('Failed to persist answer:', err);
    }
  };

  const toggleMarkForReview = (questionId) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleManualSubmit = async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setShowConfirmModal(false);
    setSubmitting(true);

    try {
      await submitAptitudeSession(id);
      navigate(`/aptitude/result/${id}`, { replace: true });
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to submit assessment.');
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const sanitizedOptions = useMemo(() => {
    return currentQ ? sanitizeQuestionOptions(currentQ.options) : [];
  }, [currentQ]);

  const answeredCount = Object.values(selectedAnswers).filter(Boolean).length;
  const reviewCount = markedForReview.size;
  const unansweredCount = Math.max(0, questions.length - answeredCount);
  const isTimeCritical = remainingSeconds < 120 && remainingSeconds > 0;
  const isCurrentMarked = currentQ ? markedForReview.has(currentQ._id) : false;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="p-6 sm:p-8 space-y-6">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full" />
              <div className="space-y-3 pt-4">
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </Card>
          </div>
          <div className="lg:col-span-4">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-4 w-28" />
              <div className="grid grid-cols-5 gap-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto pt-16 px-4">
        <ErrorState
          title="Session Unavailable"
          message={error || 'No active questions found for this session.'}
          onRetry={() => navigate('/aptitude')}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] pb-12">
      {/* ── Top Focused Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#166534] flex items-center justify-center shrink-0 text-white font-bold text-sm">
              <AptitudeIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#166534]">
                  {attempt?.category || 'Aptitude Practice'}
                </span>
                <span className="text-slate-300 hidden sm:inline">•</span>
                <span className="text-xs text-slate-500 font-medium hidden sm:inline truncate max-w-xs">
                  {currentQ?.topic || 'Assessment'}
                </span>
              </div>
              <div className="text-sm font-semibold text-slate-900 tracking-tight leading-none mt-0.5">
                Question {currentIndex + 1} of {questions.length}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Countdown Timer with accessible role and warning states */}
            <div
              role="timer"
              aria-live="polite"
              aria-label={`Time remaining: ${formatTimer(remainingSeconds)}`}
              className={`flex items-center gap-2 px-3 sm:px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-tight transition-colors ${
                isTimeCritical
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <ClockIcon
                className={`w-4 h-4 ${isTimeCritical ? 'text-amber-600' : 'text-slate-500'}`}
              />
              <span>{formatTimer(remainingSeconds)}</span>
            </div>

            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setShowConfirmModal(true)}
              loading={submitting}
            >
              Submit Test
            </Button>
          </div>
        </div>
      </header>

      {/* ── Main Workspace ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Question & Options Panel (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            <Card className="bg-white border border-slate-200/90 shadow-xs">
              <CardHeader className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="default" size="sm">
                    {(currentQ.difficulty || 'medium').toUpperCase()}
                  </Badge>
                  <span className="text-xs text-slate-300">•</span>
                  <span className="text-xs text-slate-500 font-medium">
                    {currentQ.marks || 1} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                  </span>
                  {isCurrentMarked && (
                    <Badge variant="warning" size="sm" dot>
                      Marked for Review
                    </Badge>
                  )}
                </div>

                {/* Mark for Review Toggle Button */}
                <Button
                  type="button"
                  variant={isCurrentMarked ? 'secondary' : 'outline'}
                  size="sm"
                  onClick={() => toggleMarkForReview(currentQ._id)}
                  className="text-xs shrink-0"
                >
                  {isCurrentMarked ? 'Unmark Review' : 'Mark for Review'}
                </Button>
              </CardHeader>

              <CardContent className="p-5 sm:p-7 space-y-6">
                {/* Question Text */}
                <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                  {currentQ.question}
                </div>

                {/* Answer Options Radio Group */}
                <fieldset className="space-y-3 pt-2" role="radiogroup" aria-label="Answer options">
                  <legend className="sr-only">Select your answer for question {currentIndex + 1}</legend>
                  {sanitizedOptions.map((opt) => {
                    const isSelected = selectedAnswers[currentQ._id] === opt.key;

                    return (
                      <button
                        type="button"
                        key={opt.key}
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={0}
                        onClick={() => handleSelectOption(opt.key)}
                        onKeyDown={(e) => {
                          if (e.key === ' ' || e.key === 'Enter') {
                            e.preventDefault();
                            handleSelectOption(opt.key);
                          }
                        }}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#166534] ${
                          isSelected
                            ? 'border-[#166534] bg-[#F0FDF4] ring-2 ring-[#22C55E]/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold font-mono shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-[#166534] text-white shadow-xs'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {opt.key}
                        </span>
                        <span
                          className={`text-sm pt-0.5 leading-snug flex-1 ${
                            isSelected ? 'font-semibold text-slate-900' : 'text-slate-800'
                          }`}
                        >
                          {opt.text}
                        </span>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-[#22C55E] text-white flex items-center justify-center shrink-0 mt-0.5">
                            <CheckIcon className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </fieldset>
              </CardContent>

              {/* Stepper Footer Controls */}
              <CardFooter className="p-4 sm:p-5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => prev - 1)}
                  iconLeft={<ArrowLeftIcon className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <span>
                    Question {currentIndex + 1} of {questions.length}
                  </span>
                </div>

                {currentIndex === questions.length - 1 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowConfirmModal(true)}
                    iconRight={<CheckCircleIcon className="w-3.5 h-3.5" />}
                  >
                    Review & Submit
                  </Button>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setCurrentIndex((prev) => prev + 1)}
                    iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                  >
                    Next Question
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>

          {/* Right Column: Question Navigator Sidebar (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Card className="bg-white border border-slate-200/90 shadow-xs">
              <CardHeader className="p-4 sm:p-5 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between w-full">
                  <CardTitle className="text-xs uppercase tracking-wider text-slate-600">
                    Question Navigator
                  </CardTitle>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {answeredCount}/{questions.length} Attempted
                  </span>
                </div>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 space-y-5">
                {/* Palette Grid */}
                <div className="grid grid-cols-5 gap-2" role="navigation" aria-label="Question jump palette">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAnswered = Boolean(selectedAnswers[q._id]);
                    const isReview = markedForReview.has(q._id);

                    let btnStyle = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
                    let ariaLabel = `Question ${idx + 1}: Unanswered`;

                    if (isAnswered && isReview) {
                      btnStyle =
                        'bg-amber-100 text-amber-950 border-amber-300 font-bold';
                      ariaLabel = `Question ${idx + 1}: Answered and marked for review`;
                    } else if (isReview) {
                      btnStyle =
                        'bg-amber-50 text-amber-800 border-amber-200 font-semibold';
                      ariaLabel = `Question ${idx + 1}: Marked for review`;
                    } else if (isAnswered) {
                      btnStyle =
                        'bg-[#DCFCE7] text-[#14532D] border-[#BBF7D0] font-semibold';
                      ariaLabel = `Question ${idx + 1}: Answered`;
                    }

                    if (isCurrent) {
                      btnStyle += ' ring-2 ring-[#166534] ring-offset-1 font-bold';
                    }

                    return (
                      <button
                        type="button"
                        key={q._id}
                        aria-label={ariaLabel}
                        aria-current={isCurrent ? 'true' : undefined}
                        onClick={() => setCurrentIndex(idx)}
                        className={`w-full aspect-square rounded-lg text-xs font-mono transition-all flex items-center justify-center cursor-pointer border ${btnStyle}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>

                {/* State Legend */}
                <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-[#DCFCE7] border border-[#BBF7D0] shrink-0" />
                      <span>Answered</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">{answeredCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-slate-50 border border-slate-200 shrink-0" />
                      <span>Unanswered</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">{unansweredCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded bg-amber-50 border border-amber-200 shrink-0" />
                      <span>Marked for Review</span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900">{reviewCount}</span>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-slate-500">
                    <span className="w-3.5 h-3.5 rounded ring-2 ring-[#166534] shrink-0" />
                    <span>Current Question</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    fullWidth
                    onClick={() => setShowConfirmModal(true)}
                  >
                    Finish & Submit
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* ── Submission Confirmation Modal ── */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Submit your aptitude test?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
            >
              Continue Test
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={submitting}
              onClick={handleManualSubmit}
            >
              Submit Test
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed">
            Please review your assessment summary before finalizing your test submission:
          </p>

          <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Answered
              </span>
              <span className="text-base font-bold text-[#166534] font-mono block">
                {answeredCount}
              </span>
            </div>
            <div className="space-y-0.5 border-x border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Unanswered
              </span>
              <span className="text-base font-bold text-slate-800 font-mono block">
                {unansweredCount}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">
                Review
              </span>
              <span className="text-base font-bold text-amber-700 font-mono block">
                {reviewCount}
              </span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              <AlertTriangleIcon className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span>
                You have {unansweredCount}{' '}
                {unansweredCount === 1 ? 'question' : 'questions'} unanswered. Unanswered questions will receive 0 marks.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-500 leading-normal">
            Once submitted, your answers will be evaluated on the server immediately and complete explanations will be displayed.
          </p>
        </div>
      </Modal>
    </div>
  );
}
