import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getCodingProblems, getCodingSubmissions } from '../../services/codingService.js';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Button,
  Select,
  SearchInput,
  StatCard,
  EmptyState,
  ErrorState,
  Skeleton,
  CodingIcon,
  ClockIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CompanyIcon,
  CheckCircleIcon,
  TrophyIcon,
} from '../../components/ui/index.js';

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function CodingListPage() {
  const [problems, setProblems] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('all');

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const [problemsData, submissionsData] = await Promise.all([
        getCodingProblems({
          search,
          difficulty: difficulty === 'all' ? undefined : difficulty,
          page: pagination.page,
          limit: 12,
        }),
        getCodingSubmissions({ limit: 100 }).catch((err) => {
          console.warn('Could not load student submissions:', err);
          return { submissions: [] };
        }),
      ]);

      setProblems(problemsData?.problems || []);
      setPagination(problemsData?.pagination || { total: 0, page: 1, limit: 12, pages: 1 });
      setSubmissions(submissionsData?.submissions || []);
    } catch (err) {
      console.error('Failed to load coding problems:', err);
      setError('Failed to load coding problems. Please check server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, [search, difficulty, pagination.page]);

  // Derived real student metrics strictly from actual backend submissions
  const solvedProblemIds = useMemo(() => {
    const ids = new Set();
    for (const sub of submissions) {
      if (sub.status === 'accepted' && sub.problem) {
        ids.add(sub.problem._id || sub.problem);
      }
    }
    return ids;
  }, [submissions]);

  const attemptedProblemIds = useMemo(() => {
    const ids = new Set();
    for (const sub of submissions) {
      if (sub.problem) {
        ids.add(sub.problem._id || sub.problem);
      }
    }
    return ids;
  }, [submissions]);

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

  return (
    <div className="max-w-[1240px] mx-auto space-y-6 sm:space-y-7 pb-10">
      {/* ── Page Header ── */}
      <PageHeader
        title="Coding Practice"
        description="Strengthen your problem-solving skills with structured coding challenges."
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Coding Practice' },
        ]}
        badge={
          <Badge variant="brand" size="sm">
            {pagination.total} {pagination.total === 1 ? 'Challenge' : 'Challenges'}
          </Badge>
        }
        actions={
          <Button to="/coding/history" variant="outline" size="sm" iconLeft={<ClockIcon className="w-3.5 h-3.5 text-slate-500" />}>
              Submissions History
            </Button>
        }
      />

      {/* ── Error Banner ── */}
      {error && (
        <ErrorState
          title="Problems Unavailable"
          message={error}
          onRetry={fetchList}
        />
      )}

      {/* ── Overview Metrics (Real Data Only) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Challenges"
          value={pagination.total}
          subtext="Placement coding problems"
          icon={<CodingIcon className="w-4 h-4 text-primary" />}
        />
        <StatCard
          label="Problems Solved"
          value={solvedProblemIds.size}
          subtext={
            solvedProblemIds.size === 0
              ? 'No challenges solved yet'
              : solvedProblemIds.size === 1
              ? '1 problem solved'
              : `${solvedProblemIds.size} problems solved`
          }
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Problems Attempted"
          value={attemptedProblemIds.size}
          subtext={
            attemptedProblemIds.size === 0
              ? 'Start your first problem'
              : attemptedProblemIds.size === 1
              ? '1 problem attempted'
              : `${attemptedProblemIds.size} problems attempted`
          }
          icon={<TrophyIcon className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Difficulty Tracks"
          value="3 Tracks"
          subtext="Easy, Medium, Hard"
          icon={<CompanyIcon className="w-4 h-4 text-slate-700" />}
        />
      </div>

      {/* ── Filter Bar ── */}
      <Card className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems by title, topic, or keyword..."
            />
          </div>

          <div className="w-full sm:w-56">
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              options={DIFFICULTY_OPTIONS}
            />
          </div>
        </div>
      </Card>

      {/* ── Problems List ── */}
      <Card>
        <CardHeader className="p-5 sm:p-6 pb-3 border-b border-slate-100">
          <div>
            <CardTitle>Problem Library</CardTitle>
            <CardDescription>
              Browse algorithmic challenges curated for campus recruitment technical assessments.
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-slate-500 font-mono">
            Page {pagination.page} of {pagination.pages}
          </span>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-slate-100">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-5 w-1/3" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-14 rounded-md" />
                    <Skeleton className="h-5 w-14 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          ) : problems.length === 0 ? (
            <div className="p-12 text-center">
              <EmptyState
                title={
                  pagination.total === 0
                    ? 'No coding problems available yet.'
                    : 'No problems match your filters.'
                }
                description={
                  pagination.total === 0
                    ? 'New technical interview problems will be published here.'
                    : 'Try clearing your search query or switching to All Difficulties to see more problems.'
                }
                action={
                  search || difficulty !== 'all' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearch('');
                        setDifficulty('all');
                      }}
                    >
                      Reset Filters
                    </Button>
                  ) : pagination.total === 0 ? (
                    <Button variant="outline" size="sm" onClick={fetchList}>
                      Check Back Later
                    </Button>
                  ) : null
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {problems.map((p) => {
                const problemLink = `/coding/problem/${p.slug || p._id}`;
                const isSolved = solvedProblemIds.has(p._id);
                const isAttempted = attemptedProblemIds.has(p._id);

                return (
                  <div
                    key={p._id}
                    className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getDifficultyBadge(p.difficulty)}
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.category || 'Core Algorithms'}
                        </span>
                        {isSolved ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <Badge variant="brand" size="sm" dot>
                              Solved
                            </Badge>
                          </>
                        ) : isAttempted ? (
                          <>
                            <span className="text-slate-300">•</span>
                            <Badge variant="warning" size="sm">
                              Attempted
                            </Badge>
                          </>
                        ) : null}
                      </div>

                      <div>
                        <Link
                          to={problemLink}
                          className="text-base font-bold text-slate-900 hover:text-primary transition-colors tracking-tight line-clamp-1 no-underline"
                        >
                          {p.title}
                        </Link>
                      </div>

                      {/* Topics & Company Badges */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        {(p.topics || []).map((t, idx) => (
                          <Badge key={idx} variant="default" size="sm">
                            {t}
                          </Badge>
                        ))}
                        {(p.companies || []).map((c, idx) => (
                          <Badge key={`c-${idx}`} variant="primary" size="sm">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-center">
                      <Button to={problemLink} variant={isSolved ? 'outline' : 'secondary'} size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
                          {isSolved ? 'Review Code' : 'Solve Challenge'}
                        </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* ── Pagination Footer ── */}
        {problems.length > 0 && pagination.pages > 1 && (
          <CardFooter className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} problems
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
