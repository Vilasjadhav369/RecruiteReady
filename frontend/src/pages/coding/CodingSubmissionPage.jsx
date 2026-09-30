import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCodingSubmission } from '../../services/codingService.js';

export default function CodingSubmissionPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        setLoading(true);
        const data = await getCodingSubmission(id);
        setSubmission(data);
      } catch (err) {
        console.error('Failed to load submission:', err);
        setError('Submission could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };
    fetchSub();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Retrieving submission record...</p>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
        <h3 className="text-base font-bold text-slate-900 mb-1">Submission Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'This submission does not exist.'}</p>
        <Link to="/coding/history" className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl">
          Return to Submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase bg-slate-100 text-slate-700">
              {submission.language}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              {new Date(submission.submittedAt).toLocaleString()}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {submission.problem?.title || 'Algorithm Challenge'}
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to={`/coding/problem/${submission.problem?._id || ''}`}
            className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl shadow-xs transition"
          >
            Solve Again
          </Link>
          <Link
            to="/coding/history"
            className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
          >
            History
          </Link>
        </div>
      </div>

      {/* Execution Feedback */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
        <div>
          <div className="text-xs text-slate-500 font-medium">Status</div>
          <div className="text-sm font-bold uppercase text-slate-900 mt-0.5">
            {submission.status.replace(/_/g, ' ')}
          </div>
        </div>

        {submission.executionMessage && (
          <div className="text-right text-xs text-slate-500 max-w-md">
            {submission.executionMessage}
          </div>
        )}
      </div>

      {/* Code Container */}
      <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-6 overflow-x-auto">
        <div className="text-xs font-mono text-slate-400 pb-3 border-b border-slate-800 mb-4 flex items-center justify-between">
          <span>Submitted Source Code ({submission.language})</span>
        </div>
        <pre className="text-slate-100 font-mono text-xs leading-relaxed">
          <code>{submission.code}</code>
        </pre>
      </div>
    </div>
  );
}
