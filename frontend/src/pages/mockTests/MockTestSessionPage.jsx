import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getMockAttempt,
  saveMockAnswer,
  submitMockTest,
} from '../../services/mockTestService.js';
import { Card, CardContent, Badge, Button, Modal, LoadingState, ErrorState } from '../../components/ui/index.js';
import { ClockIcon, ChevronLeftIcon, ChevronRightIcon, ExclamationIcon, FlagIcon, MenuIcon, XCircleIcon } from '../../components/ui/Icons.jsx';

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

  const timerRef = useRef(null);

  const handleAutoSubmit = useCallback(async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await submitMockTest(id);
      navigate(`/mock-tests/result/${id}`);
    } catch (err) {
      console.error('Auto-submit error:', err);
      navigate(`/mock-tests/result/${id}`);
    }
  }, [id, submitting, navigate]);

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

    try {
      await saveMockAnswer(id, {
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
      await submitMockTest(id);
      navigate(`/mock-tests/result/${id}`);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err.response?.data?.message || 'Failed to submit test.');
      setSubmitting(false);
    }
  };

  const toggleMarkForReview = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;
    
    setMarkedQuestions(prev => {
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
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return <LoadingState message="Entering secure exam environment..." />;
  }

  if (error || questions.length === 0) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <ErrorState 
          title="Session Error" 
          message={error || 'No questions available.'}
          onRetry={() => navigate('/mock-tests')}
        />
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(selectedAnswers).filter(Boolean).length;
  const isTimeCritical = remainingSeconds < 120;
  const isMarked = markedQuestions.has(currentQ._id);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* TOP BAR (sticky white bar) */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-sm font-bold text-slate-900 truncate max-w-[150px] sm:max-w-md">
            {test?.title || 'Mock Test'}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-mono font-bold transition-colors ${
              isTimeCritical
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            <ClockIcon className={`w-4 h-4 ${isTimeCritical ? 'text-amber-600 animate-pulse' : 'text-slate-500'}`} />
            {formatTimer(remainingSeconds)}
          </div>

          <Button
            variant="primary"
            onClick={() => setShowConfirmModal(true)}
            className="whitespace-nowrap"
          >
            Submit Test
          </Button>

          {/* Mobile palette toggle */}
          <button 
            className="lg:hidden p-2 text-slate-500 hover:text-slate-700 bg-slate-100 rounded-md transition-colors"
            onClick={() => setShowMobilePalette(!showMobilePalette)}
            aria-label="Toggle Question Palette"
          >
            {showMobilePalette ? <XCircleIcon className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* MAIN AREA */}
      <div className="flex-1 max-w-[1240px] w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Question Panel */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardContent className="p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {currentQ.category || 'General'} • {currentQ.topic || 'Aptitude'}
                </Badge>
                <Badge variant="outline" className="text-slate-500 font-normal">
                  {currentQ.marks || 1} Mark
                </Badge>
              </div>
              <div className="text-sm font-medium text-slate-500">
                Question {currentIndex + 1} of {questions.length}
              </div>
            </div>

            <div className="text-base sm:text-lg text-slate-900 leading-relaxed whitespace-pre-line">
              {currentQ.question}
            </div>

            {/* Options */}
            <div className="space-y-3 pt-2">
              {(currentQ.options || []).map((opt) => {
                const isSelected = selectedAnswers[currentQ._id] === opt.key;
                return (
                  <button
                    type="button"
                    key={opt.key}
                    onClick={() => handleSelectOption(opt.key)}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-start gap-3.5 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 bg-white'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-sm font-bold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm text-slate-800 pt-1 leading-snug">
                      {opt.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Mark for Review */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer w-max group">
                <input 
                  type="checkbox" 
                  checked={isMarked}
                  onChange={toggleMarkForReview}
                  className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 flex items-center gap-1.5 transition-colors">
                  <FlagIcon className={`w-4 h-4 ${isMarked ? 'text-amber-500' : 'text-slate-400'}`} />
                  Mark for Review
                </span>
              </label>
            </div>

            {/* Nav */}
            <div className="pt-6 mt-2 border-t border-slate-100 flex items-center justify-between">
              <Button
                variant="outline"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                iconLeft={<ChevronLeftIcon className="w-4 h-4" />}
              >
                Previous
              </Button>

              <Button
                variant="primary"
                disabled={currentIndex === questions.length - 1}
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                iconRight={<ChevronRightIcon className="w-4 h-4" />}
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Question Palette */}
        <div className={`lg:block ${showMobilePalette ? 'block' : 'hidden'} lg:col-span-1`}>
          <Card className="shadow-sm border-slate-200 lg:sticky lg:top-24">
            <CardContent className="p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-sm font-semibold text-slate-900">
                    Question Palette
                  </h3>
                  <span className="text-xs font-medium text-slate-500">
                    {answeredCount}/{questions.length} Answered
                  </span>
                </div>

                {/* Legend */}
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <div className="w-3 h-3 rounded bg-blue-600"></div> Current
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <div className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200"></div> Answered
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <div className="w-3 h-3 rounded bg-amber-50 border border-amber-200"></div> Marked
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-600">
                    <div className="w-3 h-3 rounded bg-slate-50 border border-slate-200"></div> Unanswered
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {questions.map((q, idx) => {
                    const isCurrent = idx === currentIndex;
                    const isAnswered = Boolean(selectedAnswers[q._id]);
                    const isQMarked = markedQuestions.has(q._id);
                    
                    let bgClass = 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100';
                    if (isCurrent) {
                      bgClass = 'bg-blue-600 text-white border-blue-600 shadow-sm';
                    } else if (isQMarked) {
                      bgClass = 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
                    } else if (isAnswered) {
                      bgClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100';
                    }

                    return (
                      <button
                        type="button"
                        key={q._id}
                        onClick={() => {
                          setCurrentIndex(idx);
                          if (window.innerWidth < 1024) setShowMobilePalette(false);
                        }}
                        className={`w-full aspect-square rounded-lg text-xs font-bold transition-all flex items-center justify-center ${bgClass}`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => !submitting && setShowConfirmModal(false)}
        title="Submit Assessment?"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleManualSubmit}
              disabled={submitting}
              loading={submitting}
            >
              {submitting ? 'Submitting...' : 'Yes, Submit'}
            </Button>
          </div>
        }
      >
        <div className="py-4">
          <div className="flex flex-col items-center justify-center text-center gap-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 mb-2">
              <ExclamationIcon className="w-6 h-6" />
            </div>
            <p className="text-slate-600 text-sm">
              You have answered <strong className="text-slate-900">{answeredCount}</strong> of <strong className="text-slate-900">{questions.length}</strong> questions.
            </p>
            <p className="text-slate-600 text-sm">
              Are you sure you want to finish the exam? This action cannot be undone.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
