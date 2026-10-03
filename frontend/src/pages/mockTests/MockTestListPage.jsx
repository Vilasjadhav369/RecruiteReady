import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMockTests, startMockTest, getMockHistory } from '../../services/mockTestService.js';
import { 
  PageHeader, 
  Card, 
  CardContent, 
  Badge, 
  Button, 
  LoadingState, 
  ErrorState, 
  EmptyState 
} from '../../components/ui/index.js';
import { 
  ClockIcon, 
  DocumentIcon,
  ArrowRightIcon
} from '../../components/ui/Icons.jsx';

export default function MockTestListPage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [activeAttempts, setActiveAttempts] = useState({});
  const [loading, setLoading] = useState(true);
  const [startingId, setStartingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTests = async () => {
      try {
        setLoading(true);
        const [testsData, historyData] = await Promise.all([
          getMockTests(),
          getMockHistory({ limit: 20 }).catch(() => ({ attempts: [] })),
        ]);
        setTests(testsData?.mockTests || []);

        const inProgressMap = {};
        (historyData?.attempts || []).forEach((att) => {
          if (att.status === 'in_progress') {
            const testId = att.mockTest?._id || att.mockTest;
            if (testId) inProgressMap[testId] = att._id;
          }
        });
        setActiveAttempts(inProgressMap);
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

  const getDifficultyVariant = (difficulty) => {
    const diff = (difficulty || '').toLowerCase();
    if (diff === 'easy') return 'default';
    if (diff === 'hard') return 'danger';
    return 'warning';
  };

  const breadcrumbs = [
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Mock Assessments' }
  ];

  const headerActions = (
    <Button 
      variant="outline" 
      iconLeft={<ClockIcon className="w-4 h-4" />}
      onClick={() => navigate('/mock-tests/history')}
    >
      Past Test Results
    </Button>
  );

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      <PageHeader
        title="Mock Assessments"
        description="Practice full-length placement assessments under realistic time conditions."
        breadcrumbs={breadcrumbs}
        actions={headerActions}
      />

      {loading ? (
        <LoadingState message="Loading assessments..." />
      ) : error ? (
        <ErrorState message={error} />
      ) : tests.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon className="w-6 h-6" />}
          title="No mock tests available yet"
          description="Full-length timed assessments will be published here by the placement committee."
          action={
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <Card key={test._id}>
              <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="space-y-4 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <Badge variant={getDifficultyVariant(test.difficulty)}>
                      {test.difficulty || 'Medium'}
                    </Badge>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <ClockIcon className="w-4 h-4" />
                        <span>{test.durationMinutes} Minutes</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DocumentIcon className="w-4 h-4" />
                        <span>{test.totalQuestions || 0} Questions</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3
                      onClick={() => navigate(`/mock-tests/${test._id}`)}
                      className="text-base sm:text-lg font-bold text-slate-900 tracking-tight hover:text-blue-600 cursor-pointer transition-colors"
                    >
                      {test.title}
                    </h3>
                    <p className="text-sm text-slate-600 leading-relaxed mt-1">
                      {test.description || 'Comprehensive campus recruitment assessment.'}
                    </p>
                  </div>

                  {(test.categories && test.categories.length > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {test.categories.map((cat, idx) => (
                        <Badge key={idx} variant="default">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="shrink-0 w-full sm:w-auto flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/mock-tests/${test._id}`)}
                    className="w-full sm:w-auto"
                  >
                    Details
                  </Button>
                  {activeAttempts[test._id] ? (
                    <Button
                      variant="primary"
                      iconRight={<ArrowRightIcon className="w-4 h-4" />}
                      onClick={() => navigate(`/mock-tests/session/${activeAttempts[test._id]}`)}
                      className="w-full sm:w-auto"
                    >
                      Resume Assessment
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      disabled={startingId === test._id}
                      loading={startingId === test._id}
                      iconRight={<ArrowRightIcon className="w-4 h-4" />}
                      onClick={() => handleStart(test._id)}
                      className="w-full sm:w-auto"
                    >
                      {startingId === test._id ? 'Starting Test...' : 'Begin Assessment'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
