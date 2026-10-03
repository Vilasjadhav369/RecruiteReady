import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMockHistory } from '../../services/mockTestService.js';
import { formatDateTime } from '../../utils/formatters.js';
import { 
  PageHeader, 
  Card, 
  Badge, 
  StatusBadge, 
  Button, 
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
import { ClockIcon, DocumentIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon } from '../../components/ui/Icons.jsx';

export default function MockTestHistoryPage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10, pages: 1 });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
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
    fetchHistory();
  }, [page]);

  const handlePrevious = () => {
    if (page > 1) setPage(p => p - 1);
  };

  const handleNext = () => {
    if (page < pagination.pages) setPage(p => p + 1);
  };


  return (
    <div className="space-y-6 max-w-[1240px] mx-auto">
      <PageHeader 
        title="Assessment History" 
        description="Review past scores, performance metrics, and answer walkthroughs."
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mock Assessments', href: '/mock-tests' },
          { label: 'History' }
        ]}
        badge={<Badge>{pagination.total} Attempts</Badge>}
        actions={
          <Button 
            variant="outline"
            iconLeft={<DocumentIcon className="w-4 h-4" />}
            onClick={() => navigate('/mock-tests')}
          >
            All Assessments
          </Button>
        }
      />

      <Card>
        {loading ? (
          <LoadingState message="Loading test history..." />
        ) : error ? (
          <div className="p-6">
            <ErrorState message={error} onRetry={() => setPage(1)} />
          </div>
        ) : attempts.length === 0 ? (
          <EmptyState 
            icon={<DocumentIcon className="w-6 h-6" />} 
            title="No mock test attempts yet" 
            description="Take a timed placement simulator test to evaluate your readiness."
            action={
              <Button onClick={() => navigate('/mock-tests')}>
                Take Mock Test
              </Button>
            }
          />
        ) : (
          <div className="flex flex-col">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Questions</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attempts.map((att) => (
                  <TableRow key={att._id}>
                    <TableCell className="font-bold text-slate-900">
                      {att.mockTest?.title || 'Mock Test'}
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">
                      {formatDateTime(att.submittedAt || att.startedAt || att.createdAt)}
                    </TableCell>
                    <TableCell>
                      {att.totalQuestions} Qs
                    </TableCell>
                    <TableCell className="font-bold text-slate-900">
                      {att.status === 'in_progress' ? '—' : `${att.score || 0} / ${att.totalQuestions || 0}`}
                    </TableCell>
                    <TableCell className="font-semibold text-blue-600">
                      {att.status === 'in_progress' ? '—' : `${att.percentage || 0}%`}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={att.status || 'submitted'} />
                    </TableCell>
                    <TableCell className="text-right">
                      {att.status === 'in_progress' ? (
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/mock-tests/session/${att._id}`)}
                        >
                          Resume
                        </Button>
                      ) : (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          iconLeft={<EyeIcon className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/mock-tests/result/${att._id}`)}
                        >
                          View Report
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
              <span className="text-sm text-slate-500">
                Page {pagination.page} of {pagination.pages}
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
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
