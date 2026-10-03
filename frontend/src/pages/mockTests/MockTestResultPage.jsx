import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getMockResult } from '../../services/mockTestService.js';
import { formatDateTime } from '../../utils/formatters.js';
import { 
  PageHeader, Card, CardContent, CardHeader, CardTitle, 
  Badge, Button, StatCard, LoadingState, ErrorState 
} from '../../components/ui/index.js';
import { 
  TrophyIcon, ChartBarIcon, DocumentIcon, CheckCircleIcon, 
  XCircleIcon, ClockIcon 
} from '../../components/ui/Icons.jsx';

export default function MockTestResultPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        setLoading(true);
        const data = await getMockResult(id);
        setResult(data);
      } catch (err) {
        console.error('Failed to load result:', err);
        setError('Failed to load assessment report.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, [id]);

  if (loading) {
    return <LoadingState message="Evaluating mock test assessment..." />;
  }

  if (error || !result) {
    return (
      <div className="max-w-md mx-auto p-6 space-y-4">
        <ErrorState 
          title="Result Unavailable" 
          message={error || 'Test results could not be located.'}
          onRetry={() => navigate('/mock-tests')}
        />
      </div>
    );
  }

  const { summary, review } = result;

  return (
    <div className="space-y-8 max-w-[1240px] mx-auto">
      <PageHeader 
        title={summary.testTitle}
        description={`Assessment completed on ${formatDateTime(summary.submittedAt)}`}
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Mock Assessments', href: '/mock-tests' },
          { label: 'Result' }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              iconLeft={<ClockIcon className="w-4 h-4" />}
              onClick={() => navigate('/mock-tests/history')}
            >
              Past Attempts
            </Button>
            <Button 
              variant="primary" 
              iconLeft={<DocumentIcon className="w-4 h-4" />}
              onClick={() => navigate('/mock-tests')}
            >
              All Assessments
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard 
          label="Score" 
          value={summary.score} 
          icon={<TrophyIcon className="w-4 h-4 text-amber-600" />} 
        />
        <StatCard 
          label="Percentage" 
          value={`${summary.percentage}%`} 
          icon={<ChartBarIcon className="w-4 h-4 text-blue-600" />} 
        />
        <StatCard 
          label="Questions" 
          value={summary.totalQuestions} 
          icon={<DocumentIcon className="w-4 h-4 text-slate-600" />} 
        />
        <StatCard 
          label="Correct" 
          value={summary.correctAnswers} 
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />} 
        />
        <StatCard 
          label="Incorrect" 
          value={summary.wrongAnswers} 
          icon={<XCircleIcon className="w-4 h-4 text-rose-600" />} 
        />
        <StatCard 
          label="Unanswered" 
          value={summary.unanswered} 
          icon={<ClockIcon className="w-4 h-4 text-slate-500" />} 
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Answer Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-8 divide-y divide-slate-100">
            {(review || []).map((item, idx) => (
              <div key={item.questionId} className={idx > 0 ? 'pt-8' : ''}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Question {idx + 1}
                  </h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{item.topic || item.category || 'General'}</Badge>
                    {item.isCorrect ? (
                      <Badge variant="success">Correct</Badge>
                    ) : (item.selectedOption ? (
                      <Badge variant="danger">Incorrect</Badge>
                    ) : (
                      <Badge variant="warning">Unanswered</Badge>
                    ))}
                  </div>
                </div>

                <p className="text-sm font-medium text-slate-900 mb-6 whitespace-pre-line">
                  {item.question}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {(item.options || []).map((opt) => {
                    const isUserPick = item.selectedOption === opt.key;
                    const isRightAnswer = item.correctOption === opt.key;

                    let optionClass = 'border-slate-200 bg-white text-slate-700';
                    if (isRightAnswer) {
                      optionClass = 'border-emerald-500 bg-emerald-50 text-emerald-900';
                    } else if (isUserPick && !isRightAnswer) {
                      optionClass = 'border-rose-500 bg-rose-50 text-rose-900';
                    }

                    return (
                      <div
                        key={opt.key}
                        className={`p-4 rounded-xl border text-sm flex items-start gap-3 ${optionClass}`}
                      >
                        <Badge variant="outline" className="bg-white shrink-0">{opt.key}</Badge>
                        <span className="flex-1 font-medium">{opt.text}</span>
                      </div>
                    );
                  })}
                </div>

                {item.explanation && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
                    <div className="font-semibold text-slate-900 mb-1">Explanation:</div>
                    <div className="leading-relaxed">{item.explanation}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
