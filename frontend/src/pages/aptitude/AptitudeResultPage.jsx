import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAptitudeResult } from '../../services/aptitudeService.js';

export default function AptitudeResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await getAptitudeResult(id);
        setResult(data);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError(err.response?.data?.message || 'Failed to load test results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Computing your assessment performance...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
        <h3 className="text-base font-bold text-slate-900 mb-1">Result Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'Unable to retrieve test score summary.'}</p>
        <Link
          to="/aptitude"
          className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
        >
          Return to Aptitude
        </Link>
      </div>
    );
  }

  const { summary, review } = result;
  const isPassed = summary.percentage >= 60;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                isPassed
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                  : 'bg-amber-50 text-amber-700 border border-amber-200/80'
              }`}
            >
              {isPassed ? 'Ready / Passing' : 'Needs Practice'}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Completed on {new Date(summary.submittedAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Assessment Results
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            {summary.category} • {summary.topic} ({summary.difficulty})
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/aptitude"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Start Another Session
          </Link>
          <Link
            to="/aptitude/history"
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
          >
            All History
          </Link>
        </div>
      </div>

      {/* Score Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Score</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.score}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Points</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Accuracy</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{summary.percentage}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Percentage</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Questions</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.totalQuestions}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Total</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Correct</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{summary.correctAnswers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Answers</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Incorrect</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{summary.wrongAnswers}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Answers</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Unanswered</div>
          <div className="text-2xl font-bold text-slate-500 mt-1">{summary.unanswered}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Skipped</div>
        </div>
      </div>

      {/* Detailed Question Review */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900">Detailed Answer Review</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review your answers alongside official solutions and step-by-step explanations.
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-500">
            {review.length} Questions
          </span>
        </div>

        <div className="divide-y divide-slate-100 space-y-6">
          {review.map((item, idx) => {
            const isAnswered = Boolean(item.selectedOption);
            const isCorrect = item.isCorrect;

            return (
              <div key={item.questionId} className={idx > 0 ? 'pt-6' : ''}>
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-medium text-slate-500">
                      {item.topic} • {item.difficulty}
                    </span>
                  </div>

                  <div>
                    {!isAnswered ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600">
                        Unanswered
                      </span>
                    ) : isCorrect ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Correct (+{item.marks} mark)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Incorrect (0 marks)
                      </span>
                    )}
                  </div>
                </div>

                {/* Question */}
                <div className="text-sm font-semibold text-slate-900 mb-3 whitespace-pre-line">
                  {item.question}
                </div>

                {/* Options list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                  {(item.options || []).map((opt) => {
                    const isUserPick = item.selectedOption === opt.key;
                    const isRightAnswer = item.correctOption === opt.key;

                    let badgeClass = 'border-slate-200 bg-white text-slate-700';
                    if (isRightAnswer) {
                      badgeClass = 'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-semibold';
                    } else if (isUserPick && !isRightAnswer) {
                      badgeClass = 'border-rose-300 bg-rose-50/60 text-rose-900 font-semibold';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-2.5 rounded-xl border text-xs flex items-start gap-2.5 ${badgeClass}`}
                      >
                        <span className="font-bold shrink-0">{opt.key}.</span>
                        <span className="flex-1">{opt.text}</span>
                        {isRightAnswer && (
                          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                            Correct
                          </span>
                        )}
                        {isUserPick && !isRightAnswer && (
                          <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                            Your Choice
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Explanation & Solution:
                  </div>
                  <div className="text-slate-600 leading-relaxed pl-5">
                    {item.explanation}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
