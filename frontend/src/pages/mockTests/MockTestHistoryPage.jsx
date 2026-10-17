import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMockHistory } from '../../services/mockTestService.js';
import { formatDateTime } from '../../utils/formatters.js';
import { 
  PageHeader, 
  Card, 
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
  LoadingState, 
  ErrorState, 
  EmptyState 
} from '../../components/ui/index.js';
import { 
  ClockIcon, 
  DocumentIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  TrophyIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ExternalLinkIcon
} from '../../components/ui/Icons.jsx';
import ExportActions from '../../components/common/ExportActions.jsx';

export default function MockTestHistoryPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMockHistory({ page, limit: 10 });
      setAttempts(data?.attempts || []);
      setPagination(data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 });
    } catch (err) {
      console.error('Failed to load mock history:', err);
      setError('Failed to load past mock test attempts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  const handlePrevious = () => {
    if (page > 1) setPage((p) => p - 1);
  };

  const handleNext = () => {
    if (page < pagination.pages) setPage((p) => p + 1);
  };

  // Derive summary metrics from loaded attempts
  const completedAttempts = attempts.filter((a) => a.status === 'submitted' || a.status === 'expired');
  const avgPercentage = completedAttempts.length > 0
    ? Math.round(completedAttempts.reduce((acc, curr) => acc + (curr.percentage || 0), 0) / completedAttempts.length)
    : null;
  const bestPercentage = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map((a) => a.percentage || 0))
    : null;

  return (
    <div className="space-y-6 max-w-[1240px] mx-auto">
      {/* ── Page Header ── */}
      <PageHeader 
        title="Assessment History" 
        description="Audit all initiated and completed placement mock tests, examine score breakdowns, and review question walkthroughs."
        breadcrumbs={[
          { label: 'Dashboard', to: '/dashboard' },
          { label: 'Mock Tests', to: '/mock-tests' },
          { label: 'History' }
        ]}
        badge={
          <Badge variant="primary" size="sm">
            {pagination.total} Past Records
          </Badge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ExportActions
              filename="mock-test-history.csv"
              rows={attempts}
              columns={[
                { label: 'Test', value: (a) => a.mockTest?.title || 'Mock Test' },
                { label: 'Date', value: (a) => a.submittedAt || a.startedAt || a.createdAt },
                { label: 'Status', value: (a) => a.status },
                { label: 'Score', value: (a) => a.score },
                { label: 'Total questions', value: (a) => a.totalQuestions },
                { label: 'Percentage', value: (a) => a.percentage },
              ]}
            />
            <Button to="/mock-tests" variant="outline" size="sm" iconLeft={<DocumentIcon className="w-4 h-4" />}>
              All Assessments
            </Button>
          </div>
        }
      />

      {/* ── Summary StatCards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Attempts"
          value={pagination.total}
          subtext="Sessions recorded"
          icon={<DocumentIcon className="w-4 h-4 text-brand-dark" />}
        />
        <StatCard
          label="Evaluated"
          value={completedAttempts.length}
          subtext="Submitted or expired"
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Avg Score"
          value={avgPercentage !== null ? `${avgPercentage}%` : '—'}
          subtext="Across page attempts"
          icon={<TrophyIcon className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Top Accuracy"
          value={bestPercentage !== null ? `${bestPercentage}%` : '—'}
          subtext="Best attempt on page"
          icon={<ClockIcon className="w-4 h-4 text-brand" />}
        />
      </div>

      {/* ── History Table Card ── */}
      <Card>
        {loading ? (
          <LoadingState message="Loading test history records..." />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={fetchHistory} />
          </div>
        ) : attempts.length === 0 ? (
          <div className="p-12 text-center">
            <EmptyState 
              icon={<DocumentIcon className="w-8 h-8 text-slate-400" />} 
              title="No mock test attempts recorded yet" 
              description="Complete a timed assessment to measure your readiness and review answer walkthroughs."
              action={
                <Button to="/mock-tests" variant="primary" size="sm">
                    Explore Assessments
                  </Button>
              }
            />
          </div>
        ) : (
          <div className="flex flex-col">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment Title</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Accuracy</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((att) => {
                  const testTitle = att.mockTest?.title || 'Mock Test Assessment';
                  const isInProgress = att.status === 'in_progress';
                  const dateStr = formatDateTime(att.submittedAt || att.startedAt || att.createdAt);

                  return (
                    <TableRow key={att._id}>
                      <TableCell className="font-semibold text-slate-900 text-xs">
                        <span className="block">{testTitle}</span>
                        {att.mockTest?.difficulty && (
                          <span className="text-[10px] text-slate-500 capitalize">
                            {att.mockTest.difficulty} level
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <ClockIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{dateStr}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-600 font-mono">
                        {att.totalQuestions} Qs
                      </TableCell>
                      <TableCell className="font-bold text-slate-900 text-xs font-mono">
                        {isInProgress ? '—' : `${att.score ?? 0} pts`}
                      </TableCell>
                      <TableCell className="font-bold text-brand-dark text-xs font-mono">
                        {isInProgress ? '—' : `${att.percentage ?? 0}%`}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={att.status || 'submitted'} />
                      </TableCell>
                      <TableCell className="text-right">
                        {isInProgress ? (
                          <Button 
                            variant="primary"
                            size="sm" 
                            iconRight={<ArrowRightIcon className="w-3 h-3" />}
                            onClick={() => navigate(`/mock-tests/session/${att._id}`)}
                          >
                            Resume
                          </Button>
                        ) : (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            iconRight={<ExternalLinkIcon className="w-3 h-3" />}
                            onClick={() => navigate(`/mock-tests/result/${att._id}`)}
                          >
                            View Report
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            
            {/* Pagination Footer */}
            {pagination.pages > 1 && (
              <CardFooter className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                <span className="text-xs text-slate-500">
                  Page {pagination.page} of {pagination.pages} ({pagination.total} total attempts)
                </span>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    iconLeft={<ChevronLeftIcon className="w-3.5 h-3.5" />}
                    onClick={handlePrevious} 
                    disabled={page <= 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    iconRight={<ChevronRightIcon className="w-3.5 h-3.5" />}
                    onClick={handleNext} 
                    disabled={page >= pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </CardFooter>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
