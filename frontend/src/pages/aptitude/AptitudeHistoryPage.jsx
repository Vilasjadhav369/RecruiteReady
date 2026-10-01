import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAptitudeHistory } from '../../services/aptitudeService.js';
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
  AptitudeIcon,
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  CheckCircleIcon,
} from '../../components/ui/index.js';

export default function AptitudeHistoryPage() {
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAptitudeHistory({ page: pagination.page, limit: 10 });
      setAttempts(data?.attempts || []);
      setPagination(data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      console.error('Failed to load history:', err);
      setError('Failed to load past aptitude test attempts. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [pagination.page]);

  // Derived metrics from real attempts
  const completed = attempts.filter((a) => a.status === 'submitted' || a.status === 'expired');
  const avgAccuracy =
    completed.length > 0
      ? Math.round(
          completed.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / completed.length
        )
      : null;
  const bestScore =
    completed.length > 0
      ? Math.max(...completed.map((a) => a.percentage || 0))
      : null;

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Aptitude Attempt History"
        description="Review your past assessment sessions, accuracy records, and solution walkthroughs."
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Aptitude', to: '/aptitude' },
          { label: 'History' },
        ]}
        badge={
          <Badge variant="primary" size="sm">
            {pagination.total} Past Attempts
          </Badge>
        }
        actions={
          <Link to="/aptitude">
            <Button
              variant="primary"
              size="sm"
              iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
            >
              New Practice Session
            </Button>
          </Link>
        }
      />

      {/* ── Error State ── */}
      {error && (
        <ErrorState
          title="Unable to load history"
          message={error}
          onRetry={fetchHistory}
        />
      )}

      {/* ── Summary Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Recorded Attempts"
          value={pagination.total}
          subtext="Practice sessions logged"
          icon={<ClockIcon className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          label="Completed Sessions"
          value={completed.length}
          subtext={completed.length > 0 ? 'On current page' : 'No submitted tests'}
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Average Accuracy"
          value={avgAccuracy !== null ? `${avgAccuracy}%` : '—'}
          subtext={avgAccuracy !== null ? 'Across page attempts' : 'Awaiting completed tests'}
          icon={<AptitudeIcon className="w-4 h-4 text-slate-700" />}
        />
        <StatCard
          label="Highest Score"
          value={bestScore !== null ? `${bestScore}%` : '—'}
          subtext={bestScore !== null ? 'Personal best on page' : 'No scores recorded'}
          icon={<TrophyIcon className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* ── Attempts Table Card ── */}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Attempt Log</CardTitle>
            <CardDescription>
              Chronological listing of all initiated and completed aptitude practice tests.
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category / Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <SkeletonTableRow columns={8} />
                <SkeletonTableRow columns={8} />
                <SkeletonTableRow columns={8} />
                <SkeletonTableRow columns={8} />
              </TableBody>
            </Table>
          ) : attempts.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                title="No aptitude attempts yet"
                description="Start your first practice session to build your placement readiness track record."
                action={
                  <Link to="/aptitude">
                    <Button variant="primary" size="sm">
                      Start Practicing
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category / Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((att) => {
                  const dateStr = att.submittedAt || att.createdAt
                    ? new Date(att.submittedAt || att.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—';

                  return (
                    <TableRow key={att._id}>
                      <TableCell className="text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium text-slate-900 text-xs">
                        <div>{att.category || 'General Aptitude'}</div>
                        {att.topic && att.topic !== 'all' && (
                          <div className="text-[11px] text-slate-500">{att.topic}</div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-xs text-slate-600 font-medium">
                          {att.difficulty || 'mixed'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600">
                        {att.totalQuestions || 0} Qs
                      </TableCell>
                      <TableCell className="text-xs">
                        {att.status === 'in_progress' ? (
                          <span className="text-slate-400 italic">In progress</span>
                        ) : (
                          <span className="font-mono font-semibold text-slate-900">
                            {att.score || 0} pts
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {att.status === 'in_progress' ? (
                          <span className="text-slate-400">—</span>
                        ) : (
                          <Badge
                            variant={
                              (att.percentage || 0) >= 70
                                ? 'success'
                                : (att.percentage || 0) >= 50
                                ? 'warning'
                                : 'default'
                            }
                            size="sm"
                          >
                            {att.percentage || 0}%
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={att.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        {att.status === 'in_progress' ? (
                          <Link to={`/aptitude/session/${att._id}`}>
                            <Button variant="outline" size="sm">
                              Resume
                            </Button>
                          </Link>
                        ) : (
                          <Link to={`/aptitude/result/${att._id}`}>
                            <Button variant="ghost" size="sm">
                              View Result
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {/* ── Pagination Footer ── */}
        {attempts.length > 0 && pagination.pages > 1 && (
          <CardFooter>
            <span className="text-xs text-slate-500">
              Page {pagination.page} of {pagination.pages} ({pagination.total} total sessions)
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
