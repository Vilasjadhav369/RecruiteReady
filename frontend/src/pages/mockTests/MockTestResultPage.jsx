import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getMockResult } from '../../services/mockTestService.js';

export default function MockTestResultPage() {
  const { id } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await getMockResult(id);
        setResult(data);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError('Failed to load assessment report.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Evaluating mock test assessment...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
        <h3 className="text-base font-bold text-slate-900 mb-1">Result Unavailable</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'Test results could not be located.'}</p>
        <Link to="/mock-tests" className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl">
          Return to Mock Tests
        </Link>
      </div>
    );
  }

  const { summary, review } = result;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs text-slate-500 font-medium">
              Completed on {new Date(summary.submittedAt).toLocaleDateString()}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {summary.testTitle}
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Official assessment scoring and question-by-question walkthrough.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/mock-tests"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            All Mock Tests
          </Link>
          <Link
            to="/mock-tests/history"
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
          >
            Past Attempts
          </Link>
        </div>
      </div>

      {/* Score Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Score</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{summary.score}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Points</div>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs text-center">
          <div className="text-xs text-slate-500 font-medium">Percentage</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{summary.percentage}%</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Overall</div>
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

      {/* Question by Question Review */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
          Answer Explanations
        </h2>

        <div className="divide-y divide-slate-100 space-y-6">
          {(review || []).map((item, idx) => (
            <div key={item.questionId} className={idx > 0 ? 'pt-6' : ''}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800">
                  Question {idx + 1} ({item.topic || 'Aptitude'})
                </span>
                {item.isCorrect ? (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Correct
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                    Incorrect / Skipped
                  </span>
                )}
              </div>

              <div className="text-sm font-semibold text-slate-900 mb-3 whitespace-pre-line">
                {item.question}
              </div>

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
                      className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${badgeClass}`}
                    >
                      <span className="font-bold shrink-0">{opt.key}.</span>
                      <span className="flex-1">{opt.text}</span>
                    </div>
                  );
                })}
              </div>

              {item.explanation && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                  <span className="font-bold text-slate-800 block mb-0.5">Solution:</span>
                  {item.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
