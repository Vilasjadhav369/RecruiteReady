import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMockTests, startMockTest } from '../../services/mockTestService.js';

export default function MockTestListPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const data = await getMockTests();
        setTests(data?.mockTests || []);
      } catch (err) {
        console.error('Failed to load mock tests:', err);
        setError('Failed to load mock assessments.');
      } finally {
        setLoading(false);
      }
    };
    fetchTests();
  }, []);

  const handleStart = async (testId) => {
    try {
      setStartingId(testId);
      const data = await startMockTest(testId);
      if (data?.attemptId) {
        navigate(`/mock-tests/session/${data.attemptId}`);
      }
    } catch (err) {
      console.error('Failed to start mock test:', err);
      alert(err.response?.data?.message || 'Could not start this test.');
    } finally {
      setStartingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/60">
              Exam Simulator
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Timed Campus Placement Tests
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Mock Assessments
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Full-length timed evaluation modeled after actual recruitment patterns.
          </p>
        </div>

        <Link
          to="/mock-tests/history"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Past Test Results
        </Link>
      </div>

      {/* Test List Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-rose-200 border-t-rose-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading assessments...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-600 bg-white rounded-2xl border border-slate-200">{error}</div>
      ) : tests.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No mock tests available yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Full-length timed assessments will be published here by the placement committee.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <div
              key={test._id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5"
            >
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-600">
                    {test.difficulty || 'Medium'}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {test.totalQuestions || 0} Questions • {test.durationMinutes} Minutes
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{test.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {test.description || 'Comprehensive campus recruitment assessment.'}
                </p>

                <div className="flex flex-wrap gap-1.5 pt-1">
                  {(test.categories || []).map((cat, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 text-[10px] font-medium"
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              <div className="shrink-0 w-full sm:w-auto">
                <button
                  type="button"
                  disabled={startingId === test._id}
                  onClick={() => handleStart(test._id)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
                >
                  {startingId === test._id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Starting Test...
                    </>
                  ) : (
                    <>
                      Begin Assessment
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
