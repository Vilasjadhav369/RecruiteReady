import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCodingProblem, submitCodingProblem } from '../../services/codingService.js';

export default function CodingProblemPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProb = async () => {
      try {
        setLoading(true);
        const data = await getCodingProblem(id);
        setProblem(data);
        if (data?.starterCode) {
          setCode(data.starterCode[language] || data.starterCode.javascript || '');
        }
      } catch (err) {
        console.error('Failed to load problem:', err);
        setError('Problem details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    fetchProb();
  }, [id]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (problem?.starterCode?.[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await submitCodingProblem(problem._id, { language, code });
      setSubmissionResult(res);
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmissionResult({
        success: false,
        message: err.response?.data?.message || 'Submission failed. Please check network.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading algorithm specification...</p>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
        <h3 className="text-base font-bold text-slate-900 mb-1">Problem Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'The requested challenge is unavailable.'}</p>
        <Link to="/coding" className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl">
          Return to Coding Arena
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/coding"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 rounded-xl text-slate-600 transition"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {problem.title}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-semibold uppercase text-slate-500">
                {problem.difficulty}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-[11px] text-slate-500 font-medium">
                {problem.category}
              </span>
            </div>
          </div>
        </div>

        <Link
          to={`/coding/history?problemId=${problem._id}`}
          className="px-3 py-1.5 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition"
        >
          My Submissions
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Problem Statement & Specs */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-6 overflow-y-auto max-h-[80vh]">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Problem Description
            </h2>
            <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
              {problem.description}
            </div>
          </div>

          {/* Examples */}
          {(problem.examples || []).length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                Examples
              </h3>
              <div className="space-y-3">
                {problem.examples.map((ex, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5 text-xs font-mono">
                    <div>
                      <span className="text-slate-400 font-sans font-medium">Input: </span>
                      <span className="text-slate-900">{ex.input}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-sans font-medium">Output: </span>
                      <span className="text-slate-900 font-bold">{ex.output}</span>
                    </div>
                    {ex.explanation && (
                      <div className="text-slate-500 font-sans text-[11px] pt-1">
                        Explanation: {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Constraints */}
          {(problem.constraints || []).length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Constraints
              </h3>
              <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 font-mono">
                {problem.constraints.map((c, idx) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Code Editor & Execution Panel */}
        <div className="bg-slate-900 rounded-2xl shadow-lg border border-slate-800 p-5 space-y-4 flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-amber-500/80"></span>
              <span className="w-3 h-3 rounded-full bg-emerald-500/80"></span>
              <span className="text-xs font-mono font-semibold text-slate-400 ml-2">editor</span>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3</option>
              <option value="java">Java 17</option>
              <option value="cpp">C++ 20</option>
            </select>
          </div>

          {/* Code Textarea */}
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={16}
              spellCheck="false"
              className="w-full bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none p-1"
              placeholder="// Write your algorithm solution here..."
            />
          </div>

          {/* Action Button */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-mono">
              Press Submit to evaluate against test cases
            </span>

            <button
              type="button"
              disabled={submitting || !code.trim()}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Evaluating...
                </>
              ) : (
                <>
                  Submit Code
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          </div>

          {/* Execution Output Panel */}
          {submissionResult && (
            <div className="p-4 rounded-xl border bg-slate-800/80 border-slate-700 space-y-2 mt-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300">Execution Result:</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    submissionResult.data?.submission?.status === 'accepted'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}
                >
                  {submissionResult.data?.submission?.status || 'Submitted'}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                {submissionResult.message || submissionResult.data?.submission?.executionMessage}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
