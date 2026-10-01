import React, { useState, useEffect, useRef, useCallback } from 'react';
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
} from '../../components/ui/index.js';

export default function AptitudeSessionPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Timer interval ref
  const timerRef = useRef(null);

  // Auto-submit callback
  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await submitAptitudeSession(id);
      navigate(`/aptitude/result/${id}`);
    } catch (err) {
      console.error('Auto-submit error:', err);
      navigate(`/aptitude/result/${id}`);
    }
  }, [id, submitting, navigate]);

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

        // Prepopulate answers
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
    if (!currentQ) return;

    const newOption = selectedAnswers[currentQ._id] === optionKey ? '' : optionKey;
    setSelectedAnswers((prev) => ({ ...prev, [currentQ._id]: newOption }));

    // Persist in background
    try {
      await saveAptitudeAnswer(id, {
        questionId: currentQ._id,
        selectedOption: newOption,
      });
    } catch (err) {
      console.error('Failed to save answer:', err);
    }
  };

  const handleManualSubmit = async () => {
    setShowConfirmModal(false);
    setSubmitting(true);
    try {
      await submitAptitudeSession(id);
      navigate(`/aptitude/result/${id}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to submit test.');
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-6">
        <Card className="p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 sm:p-8 space-y-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-16 w-full" />
            <div className="space-y-3 pt-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </Card>
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
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <ErrorState
          title="Session Unavailable"
          message={error || 'No active questions found for this session.'}
          onRetry={() => navigate('/aptitude')}
        />
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(selectedAnswers).filter(Boolean).length;
  const isTimeCritical = remainingSeconds < 120;

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── Active Header: Session Info, Live Timer, Submit ── */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="primary" size="sm">
                Question {currentIndex + 1} of {questions.length}
              </Badge>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {answeredCount} answered
              </span>
            </div>
            <div className="text-base font-bold text-slate-900 tracking-tight mt-1">
              {attempt?.category}
              {currentQ?.topic && <span className="text-slate-400 font-normal"> — {currentQ.topic}</span>}
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Countdown Timer Display */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-mono font-bold tracking-tight transition-colors ${
                isTimeCritical
                  ? 'bg-red-50 border-red-200 text-red-700 animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <ClockIcon className={`w-4 h-4 ${isTimeCritical ? 'text-red-600' : 'text-slate-500'}`} />
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
      </Card>

      {/* ── Main Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Question & Options Panel */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Badge variant="default" size="sm">
                {(currentQ.difficulty || 'medium').toUpperCase()}
              </Badge>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">
                {currentQ.marks || 1} {currentQ.marks === 1 ? 'Mark' : 'Marks'}
              </span>
            </div>
            <span className="text-xs text-slate-400">
              Single Choice Selection
            </span>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Question Text */}
            <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
              {currentQ.question}
            </div>

            {/* Answer Options */}
            <div className="space-y-2.5 pt-2">
              {(currentQ.options || []).map((opt) => {
                const isSelected = selectedAnswers[currentQ._id] === opt.key;
                return (
                  <button
                    type="button"
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-150 flex items-start gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm text-slate-800 pt-0.5 leading-snug">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>

          {/* Stepper Footer Controls */}
          <CardFooter>
            <Button
              variant="outline"
              size="sm"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              iconLeft={<ArrowLeftIcon className="w-3.5 h-3.5" />}
            >
              Previous
            </Button>

            <span className="text-xs text-slate-400 font-medium">
              {currentIndex + 1} of {questions.length}
            </span>

            <Button
              variant={currentIndex === questions.length - 1 ? 'outline' : 'secondary'}
              size="sm"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
            >
              Next
            </Button>
          </CardFooter>
        </Card>

        {/* Right Column: Question Palette Sidebar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xs uppercase tracking-wider text-slate-600">
              Question Palette
            </CardTitle>
            <span className="text-xs font-semibold text-slate-700">
              {answeredCount}/{questions.length}
            </span>
          </CardHeader>

          <CardContent className="space-y-5">
            {/* Palette Grid */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = Boolean(selectedAnswers[q._id]);
                return (
                  <button
                    type="button"
                    key={q._id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`w-full aspect-square rounded-lg text-xs font-semibold transition-all flex items-center justify-center cursor-pointer ${
                      isCurrent
                        ? 'bg-slate-900 text-white shadow-xs'
                        : isAnswered
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100/60'
                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-blue-50 border border-blue-200 shrink-0" />
                <span>Answered ({answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-50 border border-slate-200 shrink-0" />
                <span>Unanswered ({questions.length - answeredCount})</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-slate-900 shrink-0" />
                <span>Current Question</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Submission Confirmation Modal ── */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Submit Assessment?"
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
              Confirm Submission
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed">
            You have answered <strong className="text-slate-900">{answeredCount}</strong> of{' '}
            <strong className="text-slate-900">{questions.length}</strong> questions.
          </p>
          {questions.length - answeredCount > 0 && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
              You still have {questions.length - answeredCount} unanswered{' '}
              {questions.length - answeredCount === 1 ? 'question' : 'questions'}. Unanswered questions receive 0 marks.
            </p>
          )}
          <p className="text-xs text-slate-500">
            Once submitted, your responses will be evaluated immediately and detailed solutions will be shown.
          </p>
        </div>
      </Modal>
    </div>
  );
}
