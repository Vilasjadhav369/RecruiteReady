import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAptitudeSession,
  saveAptitudeAnswer,
  sendAptitudeTelemetry,
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
  AptitudeIcon,
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
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved' | 'saving' | 'offline_queued' | 'sync_error'

  // Guards against race conditions or multiple submissions
  const isSubmittingRef = useRef(false);
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
        await saveAptitudeAnswer(id, {
          questionId: item.questionId,
          selectedOption: item.selectedOption,
          version: item.version,
          clientTimestamp: item.clientTimestamp,
        });
        // Dequeue upon verified server receipt
        pendingQueueRef.current.shift();
      } catch (err) {
        console.warn('Autosave sync failed:', err);
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
            navigate(`/aptitude/result/${id}`, { replace: true });
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
      sendAptitudeTelemetry(id, {
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

  // Auto-submit callback with queue flush & single-submission lock
  const handleAutoSubmit = useCallback(async () => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setSubmitting(true);

    try {
      if (pendingQueueRef.current.length > 0) {
        await processPendingQueue();
      }
      await submitAptitudeSession(id);
      navigate(`/aptitude/result/${id}`, { replace: true });
    } catch (err) {
      console.error('Auto-submit error:', err);
      navigate(`/aptitude/result/${id}`, { replace: true });
    }
  }, [id, navigate, processPendingQueue]);

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

        // Prepopulate saved answers from server
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
          const raw = sessionStorage.getItem(`aptitude_answers_${id}`);
          if (raw) localCache = JSON.parse(raw);
        } catch (e) {
          // ignore parsing error
        }

        setSelectedAnswers({ ...ansMap, ...localCache });
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

  const handleSelectOption = (optionKey) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || isSubmittingRef.current) return;

    const newOption = selectedAnswers[currentQ._id] === optionKey ? '' : optionKey;
    const newAnswers = { ...selectedAnswers, [currentQ._id]: newOption };
    setSelectedAnswers(newAnswers);

    // Persist to sessionStorage fallback buffer (P0-D)
    try {
      sessionStorage.setItem(`aptitude_answers_${id}`, JSON.stringify(newAnswers));
    } catch (e) {
      // ignore quota errors
    }

    // Sequence / version increment
    const currentVersion = (versionMapRef.current[currentQ._id] || 0) + 1;
    versionMapRef.current[currentQ._id] = currentVersion;

    // Queue for network dispatch (coalesce duplicate pending for same question)
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
      if (pendingQueueRef.current.length > 0) {
        await processPendingQueue();
      }
      await submitAptitudeSession(id);
      // Clean up sessionStorage cache upon successful submission
      try {
        sessionStorage.removeItem(`aptitude_answers_${id}`);
      } catch (e) {}
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

  // Keyboard shortcuts: A–D / 1–4 select an option, ←/→ move, M marks for review.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target?.tagName || '')) return;
      const k = e.key.toLowerCase();
      const idx = 'abcd'.includes(k) && k.length === 1 ? 'abcd'.indexOf(k) : '1234'.includes(k) && k.length === 1 ? Number(k) - 1 : -1;
      if (idx >= 0 && sanitizedOptions[idx]) {
        handleSelectOption(sanitizedOptions[idx].key);
      } else if (e.key === 'ArrowRight') {
        setCurrentIndex((i) => Math.min(i + 1, questions.length - 1));
      } else if (e.key === 'ArrowLeft') {
        setCurrentIndex((i) => Math.max(i - 1, 0));
      } else if (k === 'm' && currentQ) {
        toggleMarkForReview(currentQ._id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

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
    <div className="min-h-screen bg-background pb-12">
      {/* ── Top Focused Header ── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-xs border-b border-slate-200 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 text-white font-bold text-sm">
              <AptitudeIcon className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
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
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          isSelected
                            ? 'border-primary bg-primary-soft ring-2 ring-primary-light/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
                        }`}
                      >
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold font-mono shrink-0 transition-colors ${
                            isSelected
                              ? 'bg-primary text-white shadow-xs'
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
                          <span className="w-5 h-5 rounded-full bg-primary-light text-white flex items-center justify-center shrink-0 mt-0.5">
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
                        'bg-primary-tint text-primary-dark border-primary-border font-semibold';
                      ariaLabel = `Question ${idx + 1}: Answered`;
                    }

                    if (isCurrent) {
                      btnStyle += ' ring-2 ring-primary ring-offset-1 font-bold';
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
                      <span className="w-3.5 h-3.5 rounded bg-primary-tint border border-primary-border shrink-0" />
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
                    <span className="w-3.5 h-3.5 rounded ring-2 ring-primary shrink-0" />
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
              <span className="text-base font-bold text-primary font-mono block">
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
