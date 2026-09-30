import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAptitudeMetadata, startAptitudeSession } from '../../services/aptitudeService.js';

export default function AptitudePracticePage() {
  const navigate = useNavigate();
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);

  // Configuration Form
  const [category, setCategory] = useState('Quantitative Aptitude');
  const [topic, setTopic] = useState('all');
  const [difficulty, setDifficulty] = useState('mixed');
  const [numberOfQuestions, setNumberOfQuestions] = useState(10);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState(15);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        setLoading(true);
        const data = await getAptitudeMetadata();
        setMetadata(data);
        if (data?.categories?.length > 0) {
          setCategory(data.categories[0]);
        }
      } catch (err) {
        console.error('Failed to load aptitude metadata:', err);
        setError('Could not load test parameters. Please check server connection.');
      } finally {
        setLoading(false);
      }
    };
    fetchMeta();
  }, []);

  const handleStart = async (e) => {
    e.preventDefault();
    setError(null);
    setStarting(true);

    try {
      const data = await startAptitudeSession({
        category: category === 'all' ? undefined : category,
        topic: topic === 'all' ? undefined : topic,
        difficulty: difficulty === 'mixed' ? undefined : difficulty,
        numberOfQuestions: Number(numberOfQuestions),
        timeLimitMinutes: Number(timeLimitMinutes),
      });

      if (data?.sessionId) {
        navigate(`/aptitude/session/${data.sessionId}`);
      }
    } catch (err) {
      console.error('Error starting session:', err);
      setError(err.response?.data?.message || 'Failed to start practice session.');
    } finally {
      setStarting(false);
    }
  };

  const getCategoryCount = (cat) => {
    return metadata?.countsByCategory?.[cat] || 0;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
              Practice Track
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {metadata?.totalQuestions || 0} Questions in Database
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Aptitude Practice
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Build accuracy, speed, and confidence for campus placement assessments.
          </p>
        </div>

        <Link
          to="/aptitude/history"
          className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Past Attempts
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-start gap-2.5 animate-in fade-in">
          <svg className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span>{error}</span>
        </div>
      )}

      {/* Main Setup Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <h2 className="text-base font-bold text-slate-900 mb-1">Configure Assessment Session</h2>
        <p className="text-xs text-slate-500 mb-6">
          Customize topics and time limits. All questions are dynamically randomized by the server.
        </p>

        {loading ? (
          <div className="py-12 text-center">
            <div className="w-8 h-8 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-xs text-slate-500">Loading topic bank...</p>
          </div>
        ) : (
          <form onSubmit={handleStart} className="space-y-6">
            {/* Category Cards */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                1. Select Category
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {['Quantitative Aptitude', 'Logical Reasoning', 'Verbal Ability'].map((cat) => {
                  const isSelected = category === cat;
                  const count = getCategoryCount(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => {
                        setCategory(cat);
                        setTopic('all');
                      }}
                      className={`text-left p-4 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-600/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900">{cat}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        {count} available question{count === 1 ? '' : 's'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid of parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {/* Topic */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Specific Topic
                </label>
                <select
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="all">All Topics</option>
                  {(metadata?.topics || []).map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value="mixed">Mixed (Adaptive)</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Number of Questions
                </label>
                <select
                  value={numberOfQuestions}
                  onChange={(e) => setNumberOfQuestions(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value={5}>5 Questions</option>
                  <option value={10}>10 Questions</option>
                  <option value={15}>15 Questions</option>
                  <option value={20}>20 Questions</option>
                </select>
              </div>

              {/* Time Limit */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Time Limit
                </label>
                <select
                  value={timeLimitMinutes}
                  onChange={(e) => setTimeLimitMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                >
                  <option value={5}>5 Minutes</option>
                  <option value={10}>10 Minutes</option>
                  <option value={15}>15 Minutes</option>
                  <option value={20}>20 Minutes</option>
                  <option value={30}>30 Minutes</option>
                </select>
              </div>
            </div>

            {/* Launch button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Correct answers and explanations are revealed immediately after submission.
              </span>
              <button
                type="submit"
                disabled={starting || metadata?.totalQuestions === 0}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition disabled:opacity-50"
              >
                {starting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Preparing Questions...
                  </>
                ) : (
                  <>
                    Start Practice Session
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
