import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCodingProblems } from '../../services/codingService.js';
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
} from '../../components/ui/index.js';

const DIFFICULTY_OPTIONS = [
  { value: 'all', label: 'All Difficulties' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

export default function CodingListPage() {
  const [problems, setProblems] = useState([]);
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
      const data = await getCodingProblems({
        search,
        difficulty: difficulty === 'all' ? undefined : difficulty,
        page: pagination.page,
        limit: 12,
      });
      setProblems(data?.problems || []);
      setPagination(data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 });
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

  // Derive unique topics and companies from the loaded problems
  const uniqueCompanies = Array.from(
    new Set(problems.flatMap((p) => p.companies || []))
  ).slice(0, 8);

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Coding Practice"
        description="Master algorithmic problem solving, core data structures, and top company interview patterns."
        breadcrumbs={[
          { label: 'Student Dashboard', to: '/dashboard' },
          { label: 'Coding Practice' },
        ]}
        badge={
          <Badge variant="primary" size="sm">
            {pagination.total} Challenges
          </Badge>
        }
        actions={
          <Link to="/coding/history">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<ClockIcon className="w-3.5 h-3.5" />}
            >
              Submissions History
            </Button>
          </Link>
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

      {/* ── Overview Metrics ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Challenges"
          value={pagination.total}
          subtext="Placement coding problems"
          icon={<CodingIcon className="w-4 h-4 text-blue-600" />}
        />
        <StatCard
          label="Difficulty Tracks"
          value="3 Levels"
          subtext="Easy, Medium, Hard"
          icon={<CheckCircleIcon className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Target Companies"
          value={uniqueCompanies.length > 0 ? `${uniqueCompanies.length}+` : 'Top Tech'}
          subtext="FAANG & Tier-1 hiring patterns"
          icon={<CompanyIcon className="w-4 h-4 text-indigo-600" />}
        />
        <StatCard
          label="Supported Runtimes"
          value="JS / Py / C++"
          subtext="Multi-language test runner"
          icon={<ClockIcon className="w-4 h-4 text-amber-600" />}
        />
      </div>

      {/* ── Filter Bar ── */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search problems by title, topic, or keyword..."
            />
          </div>

          <div className="w-full sm:w-52">
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
        <CardHeader>
          <div>
            <CardTitle>Problem Library</CardTitle>
            <CardDescription>
              Browse algorithmic challenges curated for placement technical rounds.
            </CardDescription>
          </div>
          <span className="text-xs font-semibold text-slate-500">
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
                title="No coding problems match your filters"
                description="Try clearing your search query or switching to All Difficulties to see more problems."
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
                  ) : null
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {problems.map((p) => {
                const problemLink = `/coding/problem/${p.slug || p._id}`;

                return (
                  <div
                    key={p._id}
                    className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getDifficultyBadge(p.difficulty)}
                        <span className="text-xs text-slate-400 font-medium">·</span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.category || 'Algorithms'}
                        </span>
                      </div>

                      <div>
                        <Link
                          to={problemLink}
                          className="text-base font-semibold text-slate-900 hover:text-blue-600 transition-colors tracking-tight line-clamp-1"
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
                          <Badge
                            key={`c-${idx}`}
                            variant="primary"
                            size="sm"
                          >
                            {c}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="shrink-0 self-start sm:self-center">
                      <Link to={problemLink}>
                        <Button
                          variant="secondary"
                          size="sm"
                          iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                        >
                          Solve Challenge
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>

        {/* ── Pagination Footer ── */}
        {problems.length > 0 && pagination.pages > 1 && (
          <CardFooter>
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
