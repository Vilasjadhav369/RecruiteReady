import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCodingSubmissions } from '../../services/codingService.js';

export default function CodingHistoryPage() {
  const [searchParams] = useSearchParams();
  const problemId = searchParams.get('problemId') || '';

  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        setLoading(true);
        const data = await getCodingSubmissions({
          problemId: problemId || undefined,
          page: pagination.page,
          limit: 10,
        });
        setSubmissions(data?.submissions || []);
        setPagination(data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
      } catch (err) {
        console.error('Failed to load coding submissions:', err);
        setError('Failed to load past submissions.');
      } finally {
        setLoading(false);
      }
    };
    fetchSubmissions();
  }, [problemId, pagination.page]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Submissions
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {pagination.total} Past Records
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Coding Submissions
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Audit your past code executions, algorithmic solutions, and runtime status.
          </p>
        </div>

        <Link
          to="/coding"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
        >
          Coding Arena
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500 font-medium">Loading submissions...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-600">{error}</div>
        ) : submissions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">No coding submissions yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Select a coding challenge and submit your solution to start tracking results.
            </p>
            <Link
              to="/coding"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl"
            >
              Solve a Problem
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60 font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-6">Problem</th>
                  <th className="py-3 px-4">Language</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-6 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {submissions.map((sub) => (
                  <tr key={sub._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-6 font-bold text-slate-900">
                      <Link to={`/coding/problem/${sub.problem?._id || ''}`} className="hover:text-blue-600">
                        {sub.problem?.title || 'Problem'}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4 uppercase text-[10px] font-mono font-bold text-slate-600">
                      {sub.language}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase ${
                          sub.status === 'accepted'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {sub.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-mono">
                      {new Date(sub.submittedAt).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <Link
                        to={`/coding/submission/${sub._id}`}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-lg text-xs transition"
                      >
                        View Code
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
