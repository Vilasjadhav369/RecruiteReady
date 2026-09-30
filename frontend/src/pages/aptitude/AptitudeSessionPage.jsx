import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  getAptitudeSession,
  saveAptitudeAnswer,
  submitAptitudeSession,
} from '../../services/aptitudeService.js';

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
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Preparing assessment session...</p>
      </div>
    );
  }

  if (error || questions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-slate-900 mb-1">Session Unavailable</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'No questions found for this session.'}</p>
        <button
          onClick={() => navigate('/aptitude')}
          className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
        >
          Return to Practice
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const answeredCount = Object.values(selectedAnswers).filter(Boolean).length;
  const isTimeCritical = remainingSeconds < 120;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar: Progress & Timer */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex items-center justify-between gap-4">
        <div>
          <div className="text-xs text-slate-500 font-medium">
            Question {currentIndex + 1} of {questions.length}
          </div>
          <div className="text-sm font-bold text-slate-900 mt-0.5">
            {attempt?.category} • {currentQ?.topic}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-mono font-bold transition-colors ${
              isTimeCritical
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatTimer(remainingSeconds)}
          </div>

          <button
            type="button"
            onClick={() => setShowConfirmModal(true)}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition shadow-2xs"
          >
            Submit Test
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Main Question Panel */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-600">
              {currentQ.difficulty.toUpperCase()} • {currentQ.marks || 1} Mark
            </span>
            <span className="text-[11px] text-slate-400">
              Select one option below
            </span>
          </div>

          {/* Question Text */}
          <div className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed whitespace-pre-line">
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
                      ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 bg-white'
                  }`}
                >
                  <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-lg text-xs font-bold shrink-0 transition-colors ${
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

          {/* Navigation Controls */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => prev - 1)}
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Previous
            </button>

            <button
              type="button"
              disabled={currentIndex === questions.length - 1}
              onClick={() => setCurrentIndex((prev) => prev + 1)}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl disabled:opacity-30 disabled:cursor-not-allowed transition"
            >
              Next
            </button>
          </div>
        </div>

        {/* Question Palette Sidebar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Question Palette
            </h3>
            <span className="text-xs font-medium text-slate-500">
              {answeredCount}/{questions.length} Answered
            </span>
          </div>

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
                  className={`w-full aspect-square rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                    isCurrent
                      ? 'border-2 border-slate-900 bg-slate-900 text-white shadow-xs'
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
          <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-blue-50 border border-blue-200 shrink-0"></span>
              <span>Answered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-50 border border-slate-200 shrink-0"></span>
              <span>Unanswered</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-md bg-slate-900 shrink-0"></span>
              <span>Current</span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-sm w-full p-6 text-center animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Submit Assessment?</h3>
            <p className="text-xs text-slate-500 mb-6">
              You have answered <span className="font-semibold text-slate-900">{answeredCount}</span> of{' '}
              <span className="font-semibold text-slate-900">{questions.length}</span> questions.
              Are you sure you want to finish now?
            </p>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Continue Test
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleManualSubmit}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
