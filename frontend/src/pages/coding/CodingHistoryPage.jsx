import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getCodingSubmissions } from '../../services/codingService.js';
import { formatDateTime } from '../../utils/formatters.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  StatusBadge,
  Button,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  ErrorState,
  SkeletonTableRow,
  CodingIcon,
  ClockIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  ExternalLinkIcon,
} from '../../components/ui/index.js';

export default function CodingHistoryPage() {
  const [searchParams] = useSearchParams();
  const problemId = searchParams.get('problemId') || '';

  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCodingSubmissions({
        problemId: problemId || undefined,
        page: pagination.page,
        limit: 10,
      });
      setSubmissions(data?.submissions || []);
      setPagination(data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      console.error('Failed to load coding submissions:', err);
      setError('Failed to load past submissions. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, [problemId, pagination.page]);

  // Derived metrics from loaded page submissions
  const acceptedCount = submissions.filter((s) => s.status === 'accepted').length;
  const distinctLangs = Array.from(new Set(submissions.map((s) => s.language))).filter(Boolean);

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Coding Submissions"
        description="Audit your past code executions, algorithmic solutions, and runtime status."
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Coding Practice', to: '/coding' },
          { label: 'History' },
        ]}
        badge={
          <Badge variant="primary" size="sm">
            {pagination.total} Past Records
          </Badge>
        }
        actions={
          <Button to="/coding" variant="outline" size="sm" iconLeft={<ArrowLeftIcon className="w-3.5 h-3.5" />}>
              Back to Problems
            </Button>
        }
      />

      {/* ── Error Banner ── */}
      {error && (
        <ErrorState
          title="Unable to load submissions"
          message={error}
          onRetry={fetchSubmissions}
        />
      )}

      {/* ── Summary Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Submissions"
          value={pagination.total}
          subtext="Code evaluations recorded"
          icon={<CodingIcon className="w-4 h-4 text-brand-dark" />}
        />
        <StatCard
          label="Accepted (Page)"
          value={acceptedCount}
          subtext="Passed all test cases"
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Languages Used"
          value={distinctLangs.length > 0 ? distinctLangs.join(', ').toUpperCase() : '—'}
          subtext="Runtimes evaluated"
          icon={<ClockIcon className="w-4 h-4 text-slate-700" />}
        />
        <StatCard
          label="Filtered Scope"
          value={problemId ? 'Specific Problem' : 'All Problems'}
          subtext={problemId ? 'Single problem filter active' : 'Complete platform history'}
          icon={<CalendarIcon className="w-4 h-4 text-brand-dark" />}
        />
      </div>

      {/* ── Submissions Table Card ── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Execution Log</CardTitle>
            <CardDescription>
              Detailed record of each test execution and evaluation verdict.
            </CardDescription>
          </div>
          {problemId && (
            <Button to="/coding/history" variant="ghost" size="sm">
                Clear Problem Filter
              </Button>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tests Passed</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonTableRow columns={6} />
                <SkeletonTableRow columns={6} />
                <SkeletonTableRow columns={6} />
                <SkeletonTableRow columns={6} />
              </TableBody>
            </Table>
          ) : submissions.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                title="No coding submissions recorded"
                description="Select a coding challenge and submit your solution to track evaluations."
                action={
                  <Button to="/coding" variant="primary" size="sm">
                      Solve a Problem
                    </Button>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Problem</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tests Passed</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {submissions.map((sub) => {
                  const dateStr = formatDateTime(sub.submittedAt);
                  const problemTitle = sub.problem?.title || 'Coding Challenge';
                  const problemSlug = sub.problem?.slug || sub.problem?._id;

                  return (
                    <TableRow key={sub._id}>
                      <TableCell className="font-semibold text-slate-900 text-xs">
                        {problemSlug ? (
                          <Link
                            to={`/coding/problem/${problemSlug}`}
                            className="hover:text-brand-dark transition-colors font-medium text-slate-900 hover:underline"
                          >
                            {problemTitle}
                          </Link>
                        ) : (
                          <span>{problemTitle}</span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs uppercase font-mono font-semibold text-slate-600">
                        <Badge variant="default" size="sm">
                          {sub.language}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={sub.status} />
                      </TableCell>
                      <TableCell className="text-xs font-mono text-slate-600">
                        {sub.passedTests !== undefined && sub.totalTests !== undefined
                          ? `${sub.passedTests} / ${sub.totalTests}`
                          : '—'}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button to={`/coding/submission/${sub._id}`} variant="ghost" size="sm" iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}>
                            View Code
                          </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* ── Pagination Footer ── */}
        {submissions.length > 0 && pagination.pages > 1 && (
          <CardFooter>
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total submissions)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                iconLeft={<ChevronLeftIcon className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                iconRight={<ChevronRightIcon className="w-3.5 h-3.5" />}
              >
                Next
              </Button>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
