import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCodingProblem, submitCodingProblem } from '../../services/codingService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Select,
  Skeleton,
  ErrorState,
  CodingIcon,
  ClockIcon,
  CheckCircleIcon,
  CloseIcon,
  ArrowLeftIcon,
  PlayIcon,
} from '../../components/ui/index.js';

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript (Node.js)' },
  { value: 'python', label: 'Python 3' },
  { value: 'java', label: 'Java 17' },
  { value: 'cpp', label: 'C++ 20' },
];

export default function CodingProblemPage() {
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProb = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCodingProblem(id);
      setProblem(data);
      if (data?.starterCode) {
        setCode(data.starterCode[language] || data.starterCode.javascript || '');
      }
    } catch (err) {
      console.error('Failed to load problem:', err);
      setError('Problem details could not be loaded. Please verify the problem ID.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProb();
  }, [id]);

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (problem?.starterCode?.[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || !problem) return;
    setSubmitting(true);
    setSubmissionResult(null);

    try {
      const res = await submitCodingProblem(problem._id, { language, code });
      setSubmissionResult(res);
    } catch (err) {
      console.error('Submission failed:', err);
      setSubmissionResult({
        success: false,
        message: err.response?.data?.message || 'Submission failed. Please check network connection.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyBadge = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy':
        return (
          <Badge variant="success" size="sm" dot>
            Easy
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="warning" size="sm" dot>
            Medium
          </Badge>
        );
      case 'hard':
        return (
          <Badge variant="danger" size="sm" dot>
            Hard
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            {diff || 'Standard'}
          </Badge>
        );
    }
  };

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-6">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-20 w-full" />
          </Card>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-8 w-40" />
            <Skeleton className="h-64 w-full" />
          </Card>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-md mx-auto pt-8">
        <ErrorState
          title="Problem Not Found"
          message={error || 'The requested coding challenge is unavailable.'}
          onRetry={fetchProb}
        />
      </div>
    );
  }

  const isAccepted = submissionResult?.data?.submission?.status === 'accepted';
  const submissionStatus = submissionResult?.data?.submission?.status;

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title={problem.title}
        description={`${problem.category || 'Algorithms'} — Practice algorithmic implementation and test case pass rates.`}
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Coding Practice', to: '/coding' },
          { label: problem.title },
        ]}
        badge={getDifficultyBadge(problem.difficulty)}
        actions={
          <div className="flex items-center gap-2">
            <Link to="/coding">
              <Button
                variant="outline"
                size="sm"
                iconLeft={<ArrowLeftIcon className="w-3.5 h-3.5" />}
              >
                All Problems
              </Button>
            </Link>
            <Link to={`/coding/history?problemId=${problem._id}`}>
              <Button
                variant="outline"
                size="sm"
                iconLeft={<ClockIcon className="w-3.5 h-3.5" />}
              >
                Submissions
              </Button>
            </Link>
          </div>
        }
      />

      {/* ── Main Dual-Pane Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Column: Problem Specification */}
        <div className="space-y-6">
          {/* Problem Statement Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Problem Description
              </CardTitle>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(problem.topics || []).map((t, i) => (
                  <Badge key={i} variant="default" size="sm">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                {problem.description}
              </div>
            </CardContent>
          </Card>

          {/* Examples Card */}
          {(problem.examples || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Examples & Sample Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {problem.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs font-mono"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 font-sans font-medium w-16 shrink-0">Input:</span>
                      <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200/60 flex-1">
                        {ex.input}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-400 font-sans font-medium w-16 shrink-0">Output:</span>
                      <span className="text-slate-900 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200/60 flex-1">
                        {ex.output}
                      </span>
                    </div>
                    {ex.explanation && (
                      <div className="text-slate-600 font-sans text-xs pt-1 border-t border-slate-200/40">
                        <strong className="text-slate-700">Explanation: </strong>
                        {ex.explanation}
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Constraints Card */}
          {(problem.constraints || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Constraints & Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5 text-xs text-slate-700 font-mono">
                  {problem.constraints.map((c, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Code Editor & Execution Panel */}
        <div className="bg-slate-950 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col">
          {/* Editor Header Bar */}
          <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
              <span className="text-xs font-mono font-medium text-slate-400 ml-2">solution.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'js'}</span>
            </div>

            {/* Language Selector */}
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              {LANGUAGE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Code Textarea Area */}
          <div className="p-4 bg-slate-950">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={18}
              spellCheck="false"
              className="w-full bg-transparent text-slate-100 font-mono text-xs leading-relaxed focus:outline-none resize-none"
              placeholder="// Write your algorithm solution here..."
            />
          </div>

          {/* Action Footer */}
          <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              Multi-testcase evaluation runner
            </span>

            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={submitting}
              disabled={!code.trim()}
              onClick={handleSubmit}
            >
              {submitting ? 'Evaluating...' : 'Submit Code'}
            </Button>
          </div>

          {/* Execution Result Feedback Card */}
          {submissionResult && (
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-slate-300">
                  Execution Output:
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider ${
                    isAccepted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  {submissionStatus || (submissionResult.success ? 'Success' : 'Error')}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800 whitespace-pre-wrap">
                {submissionResult.message || submissionResult.data?.submission?.executionMessage || 'Execution completed.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
