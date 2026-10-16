import React, { useState, useEffect, useRef } from 'react';
import { useFeedback } from '../../components/ui/FeedbackProvider.jsx';
import { useParams } from 'react-router-dom';
import {
  getCodingProblem,
  runCodingProblem,
  submitCodingProblem,
} from '../../services/codingService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  Skeleton,
  ErrorState,
  ClockIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  PlayIcon,
  AlertTriangleIcon,
  InfoIcon,
} from '../../components/ui/index.js';
import BookmarkButton from '../../components/bookmarks/BookmarkButton.jsx';
import CodeEditor from '../../components/coding/CodeEditor.jsx';
import { recordRecentlyViewed } from "../../lib/recentlyViewed.js";

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript (Node.js)', extension: 'js' },
  { value: 'python', label: 'Python 3', extension: 'py' },
  { value: 'java', label: 'Java 17', extension: 'java' },
  { value: 'cpp', label: 'C++ 20', extension: 'cpp' },
];

export default function CodingProblemPage() {
  const { confirm } = useFeedback();
  const { id } = useParams();
  const [problem, setProblem] = useState(null);
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState('problem'); // 'problem' | 'editor' | 'output' for mobile
  const [outputTab, setOutputTab] = useState('testcases'); // 'testcases' | 'output'
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Guards against concurrent duplicate executions
  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (problem?.title) recordRecentlyViewed({ type: 'coding', id, title: problem.title, link: `/coding/problem/${id}` });
  }, [problem?.title, id]);

  const fetchProblemData = async () => {
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
      setError('Problem details could not be loaded. Please verify the problem link.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblemData();
  }, [id]);

  const handleLanguageChange = async (newLang) => {
    const isStarter =
      !code.trim() ||
      (problem?.starterCode &&
        Object.values(problem.starterCode).some((sc) => sc.trim() === code.trim()));

    if (!isStarter) {
      const confirmChange = await confirm({
        title: 'Switch language?',
        body: 'Switching languages replaces your current editor code with the template for that language.',
        confirmLabel: 'Switch language',
      });
      if (!confirmChange) return;
    }

    setLanguage(newLang);
    if (problem?.starterCode?.[newLang]) {
      setCode(problem.starterCode[newLang]);
    }
  };

  const handleResetStarterCode = async () => {
    if (problem?.starterCode?.[language]) {
      const confirmReset = await confirm({ title: 'Reset code?', body: 'Your code will be replaced with the initial starter template.', confirmLabel: 'Reset code', danger: true });
      if (confirmReset) {
        setCode(problem.starterCode[language]);
      }
    }
  };

  const handleRunCode = async () => {
    if (!code.trim() || !problem || isExecutingRef.current) return;
    isExecutingRef.current = true;
    setRunning(true);
    setRunResult(null);
    setOutputTab('output');

    try {
      const res = await runCodingProblem(problem._id, { language, code });
      setRunResult(res?.data?.runResult || {
        status: 'execution_unavailable',
        executionMessage: res?.message || 'Code executed.',
      });
    } catch (err) {
      console.error('Run code error:', err);
      setRunResult({
        status: 'error',
        executionMessage: err.response?.data?.message || 'Execution request failed. Please check connection.',
      });
    } finally {
      setRunning(false);
      isExecutingRef.current = false;
    }
  };

  const handleSubmit = async () => {
    if (!code.trim() || !problem || isExecutingRef.current) return;
    isExecutingRef.current = true;
    setSubmitting(true);
    setSubmissionResult(null);
    setOutputTab('output');

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
      isExecutingRef.current = false;
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
      <div className="max-w-7xl mx-auto space-y-6 pb-10">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 space-y-4">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </Card>
          </div>
          <div className="lg:col-span-6 space-y-4">
            <Card className="p-6 space-y-4">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-72 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (error || !problem) {
    return (
      <div className="max-w-md mx-auto pt-16 px-4">
        <ErrorState
          title="Problem Not Found"
          message={error || 'The requested coding challenge is unavailable.'}
          onRetry={fetchProblemData}
        />
      </div>
    );
  }

  const activeExtension =
    LANGUAGE_OPTIONS.find((l) => l.value === language)?.extension || 'js';

  // Real public sample test cases without hidden test cases
  const sampleTestCases = (problem.testCases || []).filter((tc) => !tc.isHidden);

  const isAccepted = submissionResult?.data?.submission?.status === 'accepted';
  const submissionStatus = submissionResult?.data?.submission?.status;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ── */}
      <PageHeader
        title={problem.title}
        description={`${problem.category || 'Core Algorithms'} — Practice algorithmic implementation and test case pass rates.`}
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Coding Practice', to: '/coding' },
          { label: problem.title },
        ]}
        badge={getDifficultyBadge(problem.difficulty)}
        actions={
          <div className="flex items-center gap-2">
            <BookmarkButton
              itemType="coding_problem"
              itemId={problem._id}
              variant="button"
              showLabel
            />
            <Button to="/coding" variant="outline" size="sm" iconLeft={<ArrowLeftIcon className="w-3.5 h-3.5 text-slate-500" />}>
                All Problems
              </Button>
            <Button to={`/coding/history?problemId=${problem._id}`} variant="outline" size="sm" iconLeft={<ClockIcon className="w-3.5 h-3.5 text-slate-500" />}>
                Submissions
              </Button>
          </div>
        }
      />

      {/* ── Mobile View Tabs ── */}
      <div className="lg:hidden flex border-b border-slate-200 bg-white rounded-xl p-1 gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('problem')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'problem'
              ? 'bg-primary-tint text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Problem Statement
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('editor')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'editor'
              ? 'bg-primary-tint text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Code Editor
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('output')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
            activeTab === 'output'
              ? 'bg-primary-tint text-primary'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Test Output
        </button>
      </div>

      {/* ── Main Dual-Pane Workspace ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Problem Specification (5 cols on desktop) */}
        <div
          className={`lg:col-span-5 space-y-5 ${
            activeTab === 'problem' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Problem Statement Card */}
          <Card className="bg-white border border-slate-200/90 shadow-xs">
            <CardHeader className="p-5 pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
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
            <CardContent className="p-5 sm:p-6 space-y-4">
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                {problem.description}
              </div>

              {/* Input & Output Format (if available) */}
              {problem.inputFormat && (
                <div className="pt-3 border-t border-slate-100 space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">
                    Input Format:
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {problem.inputFormat}
                  </p>
                </div>
              )}
              {problem.outputFormat && (
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-900 block">
                    Output Format:
                  </span>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {problem.outputFormat}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Examples Card */}
          {(problem.examples || []).length > 0 && (
            <Card className="bg-white border border-slate-200/90 shadow-xs">
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                  Examples & Sample Cases
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3.5">
                {problem.examples.map((ex, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50/80 border border-slate-200/80 rounded-xl space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 font-sans font-semibold w-16 shrink-0 pt-0.5">
                        Input:
                      </span>
                      <span className="text-slate-900 bg-white px-2.5 py-1 rounded border border-slate-200/80 flex-1 whitespace-pre-wrap">
                        {ex.input}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 font-sans font-semibold w-16 shrink-0 pt-0.5">
                        Output:
                      </span>
                      <span className="text-slate-900 font-bold bg-white px-2.5 py-1 rounded border border-slate-200/80 flex-1 whitespace-pre-wrap">
                        {ex.output}
                      </span>
                    </div>
                    {ex.explanation && (
                      <div className="text-slate-600 font-sans text-xs pt-1.5 border-t border-slate-200/60 leading-relaxed">
                        <strong className="text-slate-800">Explanation: </strong>
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
            <Card className="bg-white border border-slate-200/90 shadow-xs">
              <CardHeader className="p-5 pb-3 border-b border-slate-100">
                <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
                  Constraints & Limits
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <ul className="space-y-1.5 text-xs text-slate-700 font-mono">
                  {problem.constraints.map((c, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Code Editor & Execution Panel (7 cols on desktop) */}
        <div
          className={`lg:col-span-7 space-y-5 ${
            activeTab === 'editor' || activeTab === 'output' ? 'block' : 'hidden lg:block'
          }`}
        >
          {/* Code Editor Container */}
          <div className="bg-slate-950 rounded-xl shadow-md border border-slate-800 overflow-hidden flex flex-col">
            {/* Editor Top Bar */}
            <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-mono font-medium text-slate-400 ml-2">
                  solution.{activeExtension}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetStarterCode}
                  className="text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-[11px] h-7 px-2"
                >
                  Reset Template
                </Button>

                {/* Language Selector */}
                <label htmlFor="language-select" className="sr-only">
                  Select Programming Language
                </label>
                <select
                  id="language-select"
                  value={language}
                  onChange={(e) => handleLanguageChange(e.target.value)}
                  className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 focus:outline-none focus:ring-1 focus:ring-primary-light cursor-pointer"
                >
                  {LANGUAGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Code Textarea Area with accessible labels and keyboard indentation */}
            <div className="bg-slate-950">
              <label htmlFor="code-editor-textarea" className="sr-only">
                Source code editor for {problem.title}
              </label>
              <CodeEditor
                id="code-editor-textarea"
                value={code}
                onChange={setCode}
                language={language}
                ariaLabel="Code editor"
                placeholder="// Write your algorithm solution here..."
              />
            </div>

            {/* Action Footer */}
            <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                Tab indents • Esc then Tab exits
              </span>

              <div className="flex items-center gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={running}
                  disabled={!code.trim() || submitting}
                  onClick={handleRunCode}
                  iconLeft={!running ? <PlayIcon className="w-3.5 h-3.5" /> : null}
                  className="whitespace-nowrap border-slate-700 text-slate-200 hover:bg-slate-800 hover:border-slate-600"
                >
                  {running ? 'Running...' : 'Run Code'}
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={submitting}
                  disabled={!code.trim() || running}
                  onClick={handleSubmit}
                  className="whitespace-nowrap"
                >
                  {submitting ? 'Submitting...' : 'Submit Solution'}
                </Button>
              </div>
            </div>
          </div>

          {/* Test Cases & Execution Output Panel */}
          <Card className="bg-white border border-slate-200/90 shadow-xs">
            <CardHeader className="p-4 sm:p-5 pb-0 border-b border-slate-100">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOutputTab('testcases')}
                    className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      outputTab === 'testcases'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Sample Test Cases ({sampleTestCases.length})
                  </button>

                  <button
                    type="button"
                    onClick={() => setOutputTab('output')}
                    className={`pb-3 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                      outputTab === 'output'
                        ? 'border-primary text-primary'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Execution Output
                    {(runResult || submissionResult) && (
                      <span className="w-2 h-2 rounded-full bg-primary-light inline-block ml-1.5" />
                    )}
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 pb-3 font-mono">
                  {language.toUpperCase()}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4 sm:p-5">
              {outputTab === 'testcases' ? (
                sampleTestCases.length === 0 ? (
                  <p className="text-xs text-slate-500 py-4 text-center">
                    No public sample test cases configured for this problem.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {sampleTestCases.map((tc, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between text-slate-500 font-sans font-semibold text-[11px] pb-1 border-b border-slate-200/60">
                          <span>Case {idx + 1}</span>
                          <span className="text-slate-400 font-normal">Public Sample</span>
                        </div>
                        <div className="flex items-start gap-2 pt-0.5">
                          <span className="text-slate-500 font-sans font-semibold w-24 shrink-0">
                            Input:
                          </span>
                          <span className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200/80 flex-1 whitespace-pre-wrap">
                            {tc.input}
                          </span>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="text-slate-500 font-sans font-semibold w-24 shrink-0">
                            Expected:
                          </span>
                          <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200/80 flex-1 whitespace-pre-wrap">
                            {tc.expectedOutput}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                /* Execution Output Tab */
                <div className="space-y-3">
                  {submissionResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-200/80">
                        <div className="flex items-center gap-2.5">
                          {isAccepted ? (
                            <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <AlertTriangleIcon className="w-5 h-5 text-amber-600 shrink-0" />
                          )}
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">
                              Submission Result
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              Status: {submissionStatus?.replace(/_/g, ' ').toUpperCase() || 'EVALUATED'}
                            </span>
                          </div>
                        </div>

                        <Badge
                          variant={isAccepted ? 'brand' : submissionStatus === 'execution_unavailable' ? 'default' : 'warning'}
                          size="md"
                          dot
                        >
                          {isAccepted ? 'Accepted' : submissionStatus === 'execution_unavailable' ? 'Execution Unavailable' : submissionStatus?.replace(/_/g, ' ') || 'Submitted'}
                        </Badge>
                      </div>

                      {submissionStatus === 'execution_unavailable' && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                          <InfoIcon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-semibold block">External Sandbox Runner Inactive</span>
                            <p className="text-[11px] text-amber-800">
                              Your solution has been saved securely to your account. However, automated test evaluation is currently unavailable because an isolated code execution sandbox runner is not configured. You can continue drafting solutions or test your code locally in your development environment.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-sans font-semibold border-b border-slate-800 pb-1 flex justify-between">
                          <span>Server Verdict & Diagnostics</span>
                          <span>{submissionResult.data?.submission?.language?.toUpperCase()}</span>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed pt-1">
                          {submissionResult.message ||
                            submissionResult.data?.submission?.executionMessage ||
                            'Submission evaluated successfully.'}
                        </p>
                      </div>
                    </div>
                  ) : runResult ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3.5 rounded-xl border bg-slate-50 border-slate-200/80">
                        <div className="flex items-center gap-2">
                          <PlayIcon className="w-4 h-4 text-primary" />
                          <span className="text-xs font-bold text-slate-900">
                            Run Execution Outcome
                          </span>
                        </div>
                        <Badge
                          variant={
                            runResult.status === 'success' || runResult.status === 'accepted'
                              ? 'brand'
                              : runResult.status === 'execution_unavailable'
                              ? 'default'
                              : 'warning'
                          }
                          size="sm"
                        >
                          {runResult.status === 'execution_unavailable'
                            ? 'Execution Unavailable'
                            : runResult.status?.replace(/_/g, ' ') || 'Completed'}
                        </Badge>
                      </div>

                      {runResult.status === 'execution_unavailable' && (
                        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 leading-relaxed">
                          <InfoIcon className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                          <div className="space-y-1">
                            <span className="font-semibold block">Sandbox Runner Unavailable</span>
                            <p className="text-[11px] text-amber-800">
                              Automated test execution requires an external isolated sandbox runner which is not currently reachable. Your code syntax and solution structure remain intact in the editor.
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-xs font-mono text-slate-200 space-y-1.5">
                        <div className="text-[11px] text-slate-400 font-sans font-semibold border-b border-slate-800 pb-1">
                          Console / Runner Diagnostics
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed pt-1">
                          {runResult.executionMessage || 'No standard output recorded.'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="py-8 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                        <PlayIcon className="w-5 h-5 text-slate-500" />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-800">
                        No test output yet
                      </h4>
                      <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                        Click <strong>Run Code</strong> to test against sample cases, or{' '}
                        <strong>Submit Solution</strong> to evaluate all test cases.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
