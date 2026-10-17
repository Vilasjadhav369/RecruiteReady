import React, { useState, useEffect } from 'react';
import { getAptitudeHistory } from '../../services/aptitudeService.js';
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
  AptitudeIcon,
  ClockIcon,
  CalendarIcon,
  PlusIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  TrophyIcon,
  CheckCircleIcon,
} from '../../components/ui/index.js';
import ExportActions from '../../components/common/ExportActions.jsx';

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

  // Derived metrics from completed attempts on current page
  const completed = attempts.filter(
    (a) =>
      a.status === 'submitted' ||
      a.status === 'expired' ||
      (a.status === 'in_progress' &&
        a.timeLimitSeconds &&
        Date.now() - new Date(a.startedAt).getTime() > (a.timeLimitSeconds + 30) * 1000)
  );

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
    <div className="max-w-[1240px] mx-auto space-y-6 sm:space-y-7 pb-10">
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
          <Badge variant="brand" size="sm">
            {pagination.total} {pagination.total === 1 ? 'Past Attempt' : 'Past Attempts'}
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportActions
              filename="aptitude-history.csv"
              rows={attempts}
              columns={[
                { label: 'Category', value: (a) => a.category },
                { label: 'Topic', value: (a) => a.topic },
                { label: 'Difficulty', value: (a) => a.difficulty },
                { label: 'Date', value: (a) => a.submittedAt || a.startedAt || a.createdAt },
                { label: 'Status', value: (a) => a.status },
                { label: 'Score', value: (a) => a.score },
                { label: 'Total questions', value: (a) => a.totalQuestions },
                { label: 'Percentage', value: (a) => a.percentage },
              ]}
            />
            <Button to="/aptitude" variant="primary" size="sm" iconLeft={<PlusIcon className="w-3.5 h-3.5" />}>
              New Practice Session
            </Button>
          </div>
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
          subtext={
            pagination.total === 0
              ? 'No attempts logged'
              : pagination.total === 1
              ? '1 total attempt'
              : `${pagination.total} total attempts`
          }
          icon={<ClockIcon className="w-4 h-4 text-slate-700" />}
        />
        <StatCard
          label="Completed Sessions"
          value={completed.length}
          subtext={completed.length > 0 ? 'Evaluated on current page' : 'No submitted tests'}
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Average Accuracy"
          value={avgAccuracy !== null ? `${avgAccuracy}%` : '—'}
          subtext={avgAccuracy !== null ? 'Across page attempts' : 'Awaiting completed tests'}
          icon={<AptitudeIcon className="w-4 h-4 text-primary" />}
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
        <CardHeader className="p-5 sm:p-6 pb-3 border-b border-slate-100">
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
                  <Button to="/aptitude" variant="primary" size="sm">
                      Start Practicing
                    </Button>
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
                  const dateStr = formatDateTime(att.submittedAt || att.startedAt || att.createdAt);
                  const isExpired =
                    att.status === 'in_progress' &&
                    att.timeLimitSeconds &&
                    Date.now() - new Date(att.startedAt).getTime() >
                      (att.timeLimitSeconds + 30) * 1000;
                  const effectiveStatus = isExpired ? 'expired' : att.status;

                  return (
                    <TableRow key={att._id}>
                      <TableCell className="text-slate-500 text-xs">
                        <div className="flex items-center gap-1.5">
                          <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 text-xs">
                        <div>{att.category || 'General Aptitude'}</div>
                        {att.topic && att.topic !== 'all' && (
                          <div className="text-[11px] text-slate-500 font-normal">
                            {att.topic}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="capitalize text-xs text-slate-600 font-medium">
                          {att.difficulty || 'mixed'}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {att.totalQuestions || 0}{' '}
                        {att.totalQuestions === 1 ? 'Q' : 'Qs'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {effectiveStatus === 'in_progress' ? (
                          <span className="text-slate-400 italic">In progress</span>
                        ) : (
                          <span className="font-mono font-bold text-slate-900">
                            {att.score || 0} pts
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        {effectiveStatus === 'in_progress' ? (
                          <span className="text-slate-400 font-mono">—</span>
                        ) : (
                          <Badge
                            variant={
                              (att.percentage || 0) >= 70
                                ? 'brand'
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
                        <StatusBadge status={effectiveStatus} />
                      </TableCell>
                      <TableCell className="text-right">
                        {effectiveStatus === 'in_progress' ? (
                          <Button to={`/aptitude/session/${att._id}`} variant="outline" size="sm">
                              Resume
                            </Button>
                        ) : (
                          <Button to={`/aptitude/result/${att._id}`} variant="ghost" size="sm">
                              View Result
                            </Button>
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
          <CardFooter className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between">
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
