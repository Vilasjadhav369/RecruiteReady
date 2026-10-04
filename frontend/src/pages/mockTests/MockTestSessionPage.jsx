import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMockAttempt,
  saveMockAnswer,
  submitMockTest,
} from '../../services/mockTestService.js';
import { 
  Card, 
  CardContent, 
  Badge, 
  Button, 
  Modal, 
  LoadingState, 
  ErrorState 
} from '../../components/ui/index.js';
import { 
  ClockIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  FlagIcon, 
  MenuIcon, 
  XCircleIcon,
  CheckCircleIcon
} from '../../components/ui/Icons.jsx';

export default function MockTestSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [markedQuestions, setMarkedQuestions] = useState(new Set());
  const [showMobilePalette, setShowMobilePalette] = useState(false);

  const hasSubmittedRef = useRef(false);
  const timerRef = useRef(null);

  const performSubmission = useCallback(async (isAuto = false) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);

    try {
      await submitMockTest(id);
      navigate(`/mock-tests/result/${id}`, { replace: true });
    } catch (err) {
      console.error('Submit error:', err);
      // Even if error indicates already finalized, redirect to result
      navigate(`/mock-tests/result/${id}`, { replace: true });
    }
  }, [id, navigate]);

  useEffect(() => {
    let isMounted = true;
    const fetchAttempt = async () => {
      try {
        setLoading(true);
        const data = await getMockAttempt(id);
        if (!isMounted) return;

        if (data?.attempt?.status === 'submitted' || data?.attempt?.status === 'expired') {
          navigate(`/mock-tests/result/${id}`, { replace: true });
          return;
        }

        setAttempt(data.attempt);
        setTest(data.test);
        setQuestions(data.questions || []);
        setRemainingSeconds(data.attempt.remainingSeconds || 0);

        const ansMap = {};
        (data.attempt.answers || []).forEach((a) => {
          if (a.selectedOption) {
            ansMap[a.questionId] = a.selectedOption;
          }
        });
        setSelectedAnswers(ansMap);
      } catch (err) {
        console.error('Failed to load mock attempt:', err);
        setError(err.response?.data?.message || 'Failed to load test session.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAttempt();
    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  useEffect(() => {
    if (loading || remainingSeconds <= 0) return;

    timerRef.current = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          performSubmission(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, remainingSeconds, performSubmission]);

  const handleSelectOption = async (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || submitting) return;

    const newOption = selectedAnswers[currentQ._id] === optionKey ? '' : optionKey;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ._id]: newOption }));

    try {
      await saveMockAnswer(id, {
        questionId: currentQ._id,
        selectedOption: newOption,
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const handleManualSubmit = () => {
    setShowConfirmModal(false);
    performSubmission(false);
  };

  const toggleMarkForReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    
    setMarkedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ._id)) {
        next.delete(currentQ._id);
      } else {
        next.add(currentQ._id);
      }
      return next;
    });
  };

  const formatTimer = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingState message="Entering secure timed assessment environment..." />;
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <ErrorState 
          title="Session Error" 
          message={error || 'No questions available for this assessment.'}
          onRetry={() => navigate('/mock-tests')}
        />
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(selectedAnswers).filter(Boolean).length;
  const unansweredCount = questions.length - answeredCount;
  const markedCount = markedQuestions.size;
  const isTimeCritical = remainingSeconds < 120;
  const isMarked = markedQuestions.has(currentQ._id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* ── Fixed Assessment Bar ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 py-3 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-slate-900 truncate max-w-[160px] sm:max-w-xs md:max-w-md">
              {test?.title || 'Mock Assessment'}
            </h1>
            <span className="text-[11px] text-slate-500 hidden sm:inline">
              Timed Evaluation Mode
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-4">
          {/* Accessible Timer Display */}
          <div
            role="timer"
            aria-live="polite"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors ${
              isTimeCritical
                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                : 'bg-slate-100 text-slate-800 border border-slate-200'
            }`}
          >
            <ClockIcon className={`w-4 h-4 ${isTimeCritical ? 'text-amber-700' : 'text-slate-500'}`} />
            <span>{formatTimer(remainingSeconds)}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowConfirmModal(true)}
            className="whitespace-nowrap"
          >
            Submit Paper
          </Button>

          {/* Mobile Palette Toggle */}
          <button 
            type="button"
            className="lg:hidden p-2 text-slate-500 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            onClick={() => setShowMobilePalette(!showMobilePalette)}
            aria-label="Toggle Question Navigator"
          >
            {showMobilePalette ? <XCircleIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* ── Main Assessment Body ── */}
      <main className="flex-1 max-w-[1240px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Question Panel (Left 2 cols) */}
        <Card className="lg:col-span-2 shadow-xs border-slate-200">
          <CardContent className="p-6 sm:p-8 flex flex-col gap-6">
            {/* Question Header Meta */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" size="sm">
                  {currentQ.category || 'General'}
                </Badge>
                {currentQ.topic && (
                  <Badge variant="outline" size="sm" className="text-slate-600">
                    {currentQ.topic}
                  </Badge>
                )}
                <Badge variant="outline" size="sm" className="text-slate-500 font-mono">
                  {currentQ.marks || 1} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
                </Badge>
              </div>

              <span className="text-xs font-semibold text-slate-500 font-mono">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
              {currentQ.question}
            </div>

            {/* Answer Options */}
            <div className="space-y-3 pt-2" role="radiogroup" aria-label={`Options for Question ${currentIndex + 1}`}>
              {(currentQ.options || []).map((opt) => {
                const isSelected = selectedAnswers[currentQ._id] === opt.key;
                return (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-brand bg-[#F0FDF4] ring-1 ring-brand text-slate-900'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white text-slate-800'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-brand text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm font-medium pt-0.5 leading-snug">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Question Actions (Mark for Review) */}
            <div className="pt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={toggleMarkForReview}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isMarked
                    ? 'bg-amber-50 text-amber-800 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <FlagIcon className={`w-3.5 h-3.5 ${isMarked ? 'text-amber-600' : 'text-slate-400'}`} />
                <span>{isMarked ? 'Marked for Review' : 'Mark for Review'}</span>
              </button>

              {selectedAnswers[currentQ._id] && (
                <button
                  type="button"
                  onClick={() => handleSelectOption(selectedAnswers[currentQ._id])}
                  className="text-xs text-slate-400 hover:text-slate-600 underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="pt-6 mt-2 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                iconLeft={<ChevronLeftIcon className="w-4 h-4" />}
              >
                Previous
              </Button>

              <Button
                variant={currentIndex === questions.length - 1 ? 'primary' : 'outline'}
                size="sm"
                onClick={() => {
                  if (currentIndex < questions.length - 1) {
                    setCurrentIndex((prev) => prev + 1);
                  } else {
                    setShowConfirmModal(true);
                  }
                }}
                iconRight={currentIndex < questions.length - 1 ? <ChevronRightIcon className="w-4 h-4" /> : null}
              >
                {currentIndex === questions.length - 1 ? 'Review & Submit' : 'Next'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Palette Sidebar (Right 1 col) */}
        <div className={`lg:block ${showMobilePalette ? 'block' : 'hidden'} lg:col-span-1`}>
          <Card className="shadow-xs border-slate-200 lg:sticky lg:top-20">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Question Navigator
                </h2>
                <span className="text-xs font-bold text-slate-900 font-mono">
                  {answeredCount}/{questions.length} Answered
                </span>
              </div>

              {/* Status Summary Pills */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#DCFCE7] text-brand-dark p-2 rounded-lg border border-[#BBF7D0]">
                  <span className="block font-bold text-sm">{answeredCount}</span>
                  <span className="text-[10px]">Answered</span>
                </div>
                <div className="bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-200">
                  <span className="block font-bold text-sm">{markedCount}</span>
                  <span className="text-[10px]">Marked</span>
                </div>
                <div className="bg-slate-100 text-slate-600 p-2 rounded-lg border border-slate-200">
                  <span className="block font-bold text-sm">{unansweredCount}</span>
                  <span className="text-[10px]">Unanswered</span>
                </div>
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-brand" />
                  <span>Current</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#DCFCE7] border border-[#86EFAC]" />
                  <span>Answered</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
                  <span>Marked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-slate-100 border border-slate-300" />
                  <span>Unanswered</span>
                </div>
              </div>

              {/* Palette Grid */}
              <div className="grid grid-cols-5 gap-2 pt-2">
                {questions.map((q, idx) => {
                  const isCurrent = idx === currentIndex;
                  const isAnswered = Boolean(selectedAnswers[q._id]);
                  const isQMarked = markedQuestions.has(q._id);
                  
                  let bgClass = 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100';
                  if (isCurrent) {
                    bgClass = 'bg-brand text-white border-brand ring-2 ring-brand-light shadow-xs';
                  } else if (isQMarked) {
                    bgClass = 'bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200';
                  } else if (isAnswered) {
                    bgClass = 'bg-[#DCFCE7] text-brand-dark border-[#86EFAC] hover:bg-[#BBF7D0]';
                  }

                  return (
                    <button
                      type="button"
                      key={q._id}
                      onClick={() => {
                        setCurrentIndex(idx);
                        if (window.innerWidth < 1024) setShowMobilePalette(false);
                      }}
                      className={`w-full aspect-square rounded-lg text-xs font-bold border transition-all flex items-center justify-center cursor-pointer ${bgClass}`}
                      aria-label={`Go to Question ${idx + 1}`}
                      aria-current={isCurrent ? 'true' : undefined}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* ── Submission Confirmation Modal ── */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !submitting && setShowConfirmModal(false)}
        title="Submit Mock Test?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Continue Test
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualSubmit}
              disabled={submitting}
              loading={submitting}
            >
              {submitting ? 'Submitting...' : 'Yes, Submit Test'}
            </Button>
          </div>
        }
      >
        <div className="py-2 space-y-4">
          <p className="text-slate-600 text-sm leading-relaxed">
            Please verify your test summary before confirming final submission:
          </p>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 bg-[#DCFCE7] rounded-xl border border-[#BBF7D0]">
              <span className="block text-xl font-bold text-brand-dark">{answeredCount}</span>
              <span className="text-xs text-brand font-medium">Answered</span>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
              <span className="block text-xl font-bold text-amber-800">{markedCount}</span>
              <span className="text-xs text-amber-700 font-medium">Marked</span>
            </div>
            <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
              <span className="block text-xl font-bold text-slate-800">{unansweredCount}</span>
              <span className="text-xs text-slate-500 font-medium">Unanswered</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 text-center">
            Once submitted, your answers cannot be altered and the scorecard will be generated immediately.
          </p>
        </div>
      </Modal>
    </div>
  );
}
