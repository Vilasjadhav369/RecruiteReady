import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMockAttempt,
  saveMockAnswer,
  sendMockTelemetry,
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
  XCircleIcon
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
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'offline_queued' | 'sync_error'

  const hasSubmittedRef = useRef(false);
  const timerRef = useRef(null);
  const pendingQueueRef = useRef([]);
  const versionMapRef = useRef({});
  const isProcessingQueueRef = useRef(false);

  // Background queue worker to sync answers safely with server (P0-D)
  const processPendingQueue = useCallback(async () => {
    if (isProcessingQueueRef.current || pendingQueueRef.current.length === 0) return;
    isProcessingQueueRef.current = true;
    setSaveStatus('saving');

    while (pendingQueueRef.current.length > 0) {
      const item = pendingQueueRef.current[0];
      try {
        await saveMockAnswer(id, {
          questionId: item.questionId,
          selectedOption: item.selectedOption,
          codeSubmissionId: item.codeSubmissionId,
          version: item.version,
          clientTimestamp: item.clientTimestamp,
        });
        pendingQueueRef.current.shift();
      } catch (err) {
        console.warn('Mock autosave sync failed:', err);
        const statusCode = err.response?.status;
        if (statusCode === 401 || statusCode === 403) {
          // Unauthenticated or forbidden — terminate retrying to avoid unauthorized spam
          pendingQueueRef.current = [];
          setSaveStatus('sync_error');
          isProcessingQueueRef.current = false;
          return;
        }
        if (statusCode === 400 || statusCode === 404) {
          // Terminal client error (e.g., test submitted/expired or invalid question)
          pendingQueueRef.current.shift();
          if (err.response?.data?.message?.includes('already')) {
            navigate(`/mock-tests/result/${id}`, { replace: true });
            return;
          }
        }
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setSaveStatus('offline_queued');
        } else {
          setSaveStatus('sync_error');
        }
        isProcessingQueueRef.current = false;
        return;
      }
    }

    setSaveStatus('saved');
    isProcessingQueueRef.current = false;
  }, [id]);

  // Network recovery: immediately process queue on window 'online' event
  useEffect(() => {
    const handleOnline = () => {
      if (pendingQueueRef.current.length > 0) {
        processPendingQueue();
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [processPendingQueue]);

  // Periodic retry for pending items
  useEffect(() => {
    const retryInterval = setInterval(() => {
      if (pendingQueueRef.current.length > 0 && !isProcessingQueueRef.current) {
        processPendingQueue();
      }
    }, 4000);
    return () => clearInterval(retryInterval);
  }, [processPendingQueue]);

  // P0-E: Non-punitive focus and visibility telemetry
  useEffect(() => {
    if (loading || submitting) return;
    let lastEventTime = 0;

    const emitTelemetry = (eventType) => {
      const now = Date.now();
      if (now - lastEventTime < 1500) return;
      lastEventTime = now;
      sendMockTelemetry(id, {
        eventType,
        metadata: { timestamp: new Date().toISOString() },
      });
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        emitTelemetry('tab_hidden');
      } else {
        emitTelemetry('tab_visible');
      }
    };

    const handleBlur = () => emitTelemetry('window_blur');
    const handleFocus = () => emitTelemetry('window_focus');

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [id, loading, submitting]);

  const performSubmission = useCallback(async (isAuto = false) => {
    if (hasSubmittedRef.current) return;
    hasSubmittedRef.current = true;
    setSubmitting(true);

    try {
      if (pendingQueueRef.current.length > 0) {
        await processPendingQueue();
      }
      await submitMockTest(id);
      try {
        sessionStorage.removeItem(`mock_answers_${id}`);
      } catch (e) {}
      navigate(`/mock-tests/result/${id}`, { replace: true });
    } catch (err) {
      console.error('Submit error:', err);
      // Even if error indicates already finalized, redirect to result
      navigate(`/mock-tests/result/${id}`, { replace: true });
    }
  }, [id, navigate, processPendingQueue]);

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
          if (a.version) {
            versionMapRef.current[a.questionId] = a.version;
          }
        });

        // Merge sessionStorage cached answers if available
        let localCache = {};
        try {
          const raw = sessionStorage.getItem(`mock_answers_${id}`);
          if (raw) localCache = JSON.parse(raw);
        } catch (e) {
          // ignore parsing error
        }

        setSelectedAnswers({ ...ansMap, ...localCache });
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

  const handleSelectOption = (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || submitting) return;

    const newOption = selectedAnswers[currentQ._id] === optionKey ? '' : optionKey;
    const newAnswers = { ...selectedAnswers, [currentQ._id]: newOption };
    setSelectedAnswers(newAnswers);

    // Persist to sessionStorage fallback buffer (P0-D)
    try {
      sessionStorage.setItem(`mock_answers_${id}`, JSON.stringify(newAnswers));
    } catch (e) {
      // ignore quota errors
    }

    // Sequence / version increment
    const currentVersion = (versionMapRef.current[currentQ._id] || 0) + 1;
    versionMapRef.current[currentQ._id] = currentVersion;

    // Queue for network dispatch
    pendingQueueRef.current = pendingQueueRef.current.filter((item) => item.questionId !== currentQ._id);
    pendingQueueRef.current.push({
      questionId: currentQ._id,
      selectedOption: newOption,
      version: currentVersion,
      clientTimestamp: new Date().toISOString(),
    });

    setSaveStatus('saving');
    processPendingQueue();
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

  // Direction-aware question transition (slides forward/back, never delays input)
  const prevIdxRef = useRef(0);
  const slideClass = currentIndex >= prevIdxRef.current ? 'rr-q-next' : 'rr-q-prev';
  useEffect(() => {
    prevIdxRef.current = currentIndex;
  }, [currentIndex]);

  // Keyboard shortcuts (same scheme as aptitude): A–D / 1–4 select, ←/→ move, M marks for review.
  // Ignored while typing, while a modal is open, and with modifier keys.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || showConfirmModal || submitting) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '') || e.target?.isContentEditable) return;
      const q = questions[currentIndex];
      if (!q) return;
      const k = e.key.toLowerCase();
      const idx = k.length === 1 && 'abcd'.includes(k) ? 'abcd'.indexOf(k) : k.length === 1 && '1234'.includes(k) ? Number(k) - 1 : -1;
      if (idx >= 0 && q.options?.[idx]) handleSelectOption(q.options[idx].key);
      else if (e.key === 'ArrowRight') setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
      else if (e.key === 'ArrowLeft') setCurrentIndex((i) => Math.max(i - 1, 0));
      else if (k === 'm') toggleMarkForReview();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
          {/* Autosave Status Pill (P0-D) */}
          <div
            className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
              saveStatus === 'saved'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : saveStatus === 'saving'
                ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                : saveStatus === 'offline_queued'
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}
            title={
              saveStatus === 'saved'
                ? 'All answers synced with server'
                : saveStatus === 'saving'
                ? 'Syncing answers with server...'
                : saveStatus === 'offline_queued'
                ? 'Answers saved locally in browser. Syncing when connection is restored.'
                : 'Unable to reach server. Retrying automatically.'
            }
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                saveStatus === 'saved'
                  ? 'bg-emerald-500'
                  : saveStatus === 'saving'
                  ? 'bg-blue-500 animate-ping'
                  : saveStatus === 'offline_queued'
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
            />
            <span>
              {saveStatus === 'saved' && 'Saved'}
              {saveStatus === 'saving' && 'Saving...'}
              {saveStatus === 'offline_queued' && 'Saved locally'}
              {saveStatus === 'sync_error' && 'Sync retrying'}
            </span>
          </div>

          {/* Accessible Timer Display */}
          <div
            role="timer"
            aria-live="polite"
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors ${remainingSeconds > 0 && remainingSeconds <= 60 ? 'rr-timer-pulse' : ''} ${
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
          <CardContent key={currentQ._id} className={`p-6 sm:p-8 flex flex-col gap-6 ${slideClass}`}>
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
                        ? 'border-brand bg-primary-soft ring-1 ring-brand text-slate-900'
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
                <div className="bg-primary-tint text-brand-dark p-2 rounded-lg border border-primary-border">
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
                  <span className="w-3 h-3 rounded bg-primary-tint border border-emerald-200" />
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
                    bgClass = 'bg-primary-tint text-brand-dark border-emerald-200 hover:bg-primary-border';
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
            <div className="p-3 bg-primary-tint rounded-xl border border-primary-border">
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
