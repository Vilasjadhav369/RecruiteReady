import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMockHistory } from '../../services/mockTestService.js';

export default function MockTestHistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const data = await getMockHistory({ page: pagination.page, limit: 10 });
        setAttempts(data?.attempts || []);
        setPagination(data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      } catch (err) {
        console.error('Failed to load mock history:', err);
        setError('Failed to load past mock test attempts.');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [pagination.page]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
              Exam History
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {pagination.total} Completed Tests
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Mock Assessment History
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Review past scores, sectional metrics, and answer walkthroughs.
          </p>
        </div>

        <Link
          to="/mock-tests"
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          All Mock Tests
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading test history...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-600">{error}</div>
        ) : attempts.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No mock test attempts yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Take a timed placement simulator test to evaluate your readiness.
            </p>
            <Link
              to="/mock-tests"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Take Mock Test
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Assessment Title</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Questions</th>
                  <th className="py-3 px-4">Score</th>
                  <th className="py-3 px-4">Percentage</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attempts.map((att) => (
                  <tr key={att._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      {att.mockTest?.title || 'Mock Test'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(att.submittedAt || att.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 px-4">
                      {att.totalQuestions} Qs
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {att.score || 0} pts
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-blue-600">
                      {att.percentage || 0}%
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          att.status === 'submitted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {att.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <Link
                        to={`/mock-tests/result/${att._id}`}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition"
                      >
                        View Report
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
