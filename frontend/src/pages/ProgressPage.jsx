import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProgressSummary } from '../services/progressService.js';

export default function ProgressPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        setLoading(true);
        const res = await getProgressSummary();
        setData(res);
      } catch (err) {
        console.error('Failed to load progress:', err);
        setError('Failed to compute progress metrics.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Aggregating preparation analytics...</p>
      </div>
    );
  }

  const { aptitude, coding, mockTests, scoreTrend = [] } = data || {};
  const hasAnyActivity =
    (aptitude?.totalAttempts || 0) > 0 ||
    (coding?.totalSubmissions || 0) > 0 ||
    (mockTests?.completed || 0) > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              Performance Insights
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Verified MongoDB Metrics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Progress & Analytics
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Measure your speed, accuracy, and syllabus readiness across all placement tracks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/aptitude"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Practice Aptitude
          </Link>
          <Link
            to="/coding"
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Practice Coding
          </Link>
        </div>
      </div>

      {error ? (
        <div className="p-8 text-center text-xs text-rose-600 bg-white rounded-2xl border border-slate-200">{error}</div>
      ) : !hasAnyActivity ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">No preparation activity recorded yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
            Take aptitude practice quizzes, submit coding challenges, and attempt mock tests to view your analytics.
          </p>
          <Link
            to="/aptitude"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Start First Practice Session
          </Link>
        </div>
      ) : (
        <>
          {/* Top 3 Core Track Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Aptitude Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Aptitude</span>
                <span className="text-xs font-bold text-blue-600">{aptitude?.averagePercentage || 0}% Avg</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Tests Completed</span>
                  <span className="font-bold text-slate-900">{aptitude?.totalAttempts || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Questions Attempted</span>
                  <span className="font-bold text-slate-900">{aptitude?.questionsAttempted || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Correct Answers</span>
                  <span className="font-bold text-emerald-600">{aptitude?.correctTotal || 0}</span>
                </div>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, aptitude?.averagePercentage || 0)}%` }}
                ></div>
              </div>
            </div>

            {/* Coding Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Coding</span>
                <span className="text-xs font-bold text-indigo-600">{coding?.problemsSolved || 0} Solved</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Total Submissions</span>
                  <span className="font-bold text-slate-900">{coding?.totalSubmissions || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Accepted Solutions</span>
                  <span className="font-bold text-emerald-600">{coding?.acceptedSubmissions || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Languages Used</span>
                  <span className="font-bold text-slate-900">
                    {Object.keys(coding?.languageBreakdown || {}).length || 0}
                  </span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      coding?.totalSubmissions > 0
                        ? Math.round((coding.acceptedSubmissions / coding.totalSubmissions) * 100)
                        : 0
                    )}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Mock Tests Card */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">Mock Tests</span>
                <span className="text-xs font-bold text-rose-600">{mockTests?.averagePercentage || 0}% Avg</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Exams Attempted</span>
                  <span className="font-bold text-slate-900">{mockTests?.completed || 0}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Average Performance</span>
                  <span className="font-bold text-slate-900">{mockTests?.averagePercentage || 0}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, mockTests?.averagePercentage || 0)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Chronological Score Trend */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Score Trend Over Time</h2>
              <span className="text-xs text-slate-400 font-medium">Historical Attempt Accuracy</span>
            </div>

            {scoreTrend.length === 0 ? (
              <p className="text-xs text-slate-500 py-4 text-center">
                Complete more tests to see your score trend.
              </p>
            ) : (
              <div className="space-y-3 pt-2">
                {scoreTrend.slice(-6).map((item, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{item.label}</span>
                      <span className="font-mono text-slate-500">
                        {item.percentage}% • {new Date(item.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Topic Performance Breakdown */}
          {(aptitude?.topicPerformance || []).length > 0 && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
                Aptitude Topic Breakdown
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase">
                      <th className="py-2.5 px-4">Topic</th>
                      <th className="py-2.5 px-4">Questions Attempted</th>
                      <th className="py-2.5 px-4">Correct</th>
                      <th className="py-2.5 px-4">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {aptitude.topicPerformance.map((tp, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-900">{tp.topic}</td>
                        <td className="py-3 px-4">{tp.total}</td>
                        <td className="py-3 px-4 text-emerald-600 font-bold">{tp.correct}</td>
                        <td className="py-3 px-4 font-bold text-blue-600">{tp.accuracy}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
