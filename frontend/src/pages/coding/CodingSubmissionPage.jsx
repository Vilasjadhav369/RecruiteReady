import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getCodingSubmission } from '../../services/codingService.js';
import { formatDateTime } from '../../utils/formatters.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  StatusBadge,
  Button,
  StatCard,
  Skeleton,
  ErrorState,
  CodingIcon,
  ClockIcon,
  CheckCircleIcon,
  CloseIcon,
  ArrowLeftIcon,
  CopyIcon,
  CheckIcon,
} from '../../components/ui/index.js';

export default function CodingSubmissionPage() {
  const { id } = useParams();
  const [submission, setSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fetchSub = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCodingSubmission(id);
      setSubmission(data);
    } catch (err) {
      console.error('Failed to load submission:', err);
      setError('Submission could not be retrieved. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSub();
  }, [id]);

  const handleCopyCode = () => {
    if (!submission?.code) return;
    navigator.clipboard.writeText(submission.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="max-w-[1240px] mx-auto space-y-6 sm:space-y-7 pb-10">
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </Card>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="p-4 space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-6 w-16" />
            </Card>
          ))}
        </div>
        <Card className="p-6">
          <Skeleton className="h-48 w-full" />
        </Card>
      </div>
    );
  }

  if (error || !submission) {
    return (
      <div className="max-w-md mx-auto pt-16 px-4">
        <ErrorState
          title="Submission Not Found"
          message={error || 'This submission does not exist or has been removed.'}
          onRetry={fetchSub}
        />
      </div>
    );
  }

  const isAccepted = submission.status === 'accepted';
  const submittedDate = submission.submittedAt
    ? formatDateTime(submission.submittedAt)
    : 'Recently';

  const problemTitle = submission.problem?.title || 'Algorithm Challenge';
  const problemLink = `/coding/problem/${submission.problem?.slug || submission.problem?._id || ''}`;

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 sm:space-y-7 pb-10">
      {/* ── Page Header ── */}
      <PageHeader
        title={problemTitle}
        description={`Evaluated in ${submission.language?.toUpperCase() || 'CODE'} on ${submittedDate}`}
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Coding Practice', to: '/coding' },
          { label: 'History', to: '/coding/history' },
          { label: 'Submission Detail' },
        ]}
        badge={<StatusBadge status={submission.status} />}
        actions={
          <div className="flex items-center gap-2">
            {submission.problem && (
              <Button to={problemLink} variant="primary" size="sm">
                  Solve Again
                </Button>
            )}
            <Button to="/coding/history" variant="outline" size="sm" iconLeft={<ArrowLeftIcon className="w-3.5 h-3.5 text-slate-500" />}>
                All Submissions
              </Button>
          </div>
        }
      />

      {/* ── Execution Verdict & Performance Metrics ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="Verdict"
          value={
            isAccepted
              ? 'Accepted'
              : submission.status === 'execution_unavailable'
              ? 'Execution Unavailable'
              : submission.status === 'wrong_answer'
              ? 'Wrong Answer'
              : submission.status === 'time_limit_exceeded'
              ? 'Time Limit Exceeded'
              : submission.status?.replace(/_/g, ' ') || 'Submitted'
          }
          subtext="Evaluation outcome"
          icon={
            isAccepted ? (
              <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
            ) : (
              <CloseIcon className="w-4 h-4 text-red-600" />
            )
          }
        />
        <StatCard
          label="Tests Passed"
          value={
            submission.passedTests !== undefined && submission.totalTests !== undefined
              ? `${submission.passedTests} / ${submission.totalTests}`
              : '—'
          }
          subtext="Passed test cases"
          icon={<CodingIcon className="w-4 h-4 text-primary" />}
        />
        <StatCard
          label="Runtime"
          value={submission.runtime ? `${submission.runtime} ms` : '< 50 ms'}
          subtext="Execution latency"
          icon={<ClockIcon className="w-4 h-4 text-slate-700" />}
        />
        <StatCard
          label="Language"
          value={submission.language?.toUpperCase() || '—'}
          subtext="Compiler runtime"
        />
      </div>

      {/* ── Execution Message / Feedback ── */}
      {submission.executionMessage && (
        <Card className="bg-white border border-slate-200/90 shadow-xs">
          <CardHeader className="p-5 pb-3 border-b border-slate-100">
            <CardTitle className="text-xs uppercase tracking-wider text-slate-500">
              Execution Feedback & Console Output
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            <pre className="text-xs font-mono p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 whitespace-pre-wrap leading-relaxed">
              {submission.executionMessage}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* ── Source Code Viewer ── */}
      <div className="bg-slate-950 rounded-xl shadow-md border border-slate-800 overflow-hidden">
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
            <span className="text-xs font-mono font-medium text-slate-400 ml-2">
              submitted_code.{submission.language === 'python' ? 'py' : submission.language === 'cpp' ? 'cpp' : submission.language === 'java' ? 'java' : 'js'}
            </span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleCopyCode}
            iconLeft={
              copied ? (
                <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <CopyIcon className="w-3.5 h-3.5 text-slate-400" />
              )
            }
            className="text-slate-300 hover:text-white hover:bg-slate-800"
          >
            {copied ? 'Copied!' : 'Copy Code'}
          </Button>
        </div>

        <div className="p-5 overflow-x-auto">
          <pre className="text-slate-100 font-mono text-xs leading-relaxed">
            <code>{submission.code}</code>
          </pre>
        </div>
      </div>
    </div>
  );
}
