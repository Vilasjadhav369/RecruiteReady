import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeaderboard } from '../services/leaderboardService.js';
import { useAuth } from '../context/AuthContext.jsx';
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Badge,
  Button,
  StatCard,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Skeleton,
  SkeletonCard,
  ErrorState,
  EmptyState,
} from '../components/ui/index.js';
import {
  TrophyIcon,
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  ChartBarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  DocumentIcon,
} from '../components/ui/Icons.jsx';

export default function LeaderboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getLeaderboard();
      setData(result);
    } catch (err) {
      console.error('Failed to load leaderboard data:', err);
      setError('Unable to load leaderboard. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const leaderboard = data?.leaderboard || [];
  const formula =
    data?.formula ||
    'Points = (Aptitude Correct * 10) + (Mock Test Score) + (Accepted Coding Problems * 25)';
  const totalActive = data?.totalActiveParticipants ?? leaderboard.length;

  // Identify if current authenticated student is in the leaderboard
  const currentUserId = user?._id?.toString() || user?.id?.toString();
  const currentUserEntry = currentUserId
    ? leaderboard.find((item) => item.id?.toString() === currentUserId)
    : null;

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Leaderboard' },
  ];

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* Section 1: Page Header */}
      <PageHeader
        title="Campus Leaderboard"
        description="Merit standings calculated from verified test attempts and accepted coding solutions."
        breadcrumbs={breadcrumbs}
        badge={
          totalActive > 0 ? (
            <Badge variant="default">
              {totalActive} {totalActive === 1 ? 'Ranked Participant' : 'Ranked Participants'}
            </Badge>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/aptitude')}
            >
              Practice Aptitude
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate('/mock-tests')}
            >
              Take Mock Test
            </Button>
          </div>
        }
      />

      {/* Transparent Merit Scoring Formula Banner */}
      <Card className="border-slate-200/80 bg-slate-50/60 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
              fx
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Merit Scoring Formula
              </span>
              <p className="text-xs sm:text-sm font-mono text-slate-800 font-medium">
                {formula}
              </p>
            </div>
          </div>
          <span className="text-[11px] text-slate-500 font-medium bg-white px-2.5 py-1 rounded-md border border-slate-200/70 shrink-0">
            Strictly Verified Scores • Zero Phantom Points
          </span>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonCard key={idx} className="h-24" />
            ))}
          </div>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <Skeleton key={idx} className="h-10 w-full" />
              ))}
            </div>
          </Card>
        </div>
      ) : error ? (
        /* Error State */
        <div className="p-6">
          <ErrorState
            title="Unable to load leaderboard"
            message={error}
            onRetry={fetchLeaderboard}
          />
        </div>
      ) : leaderboard.length === 0 ? (
        /* Empty State */
        <EmptyState
          icon={<TrophyIcon className="w-8 h-8 text-slate-400" />}
          title="No leaderboard data available yet"
          description="Rankings are automatically computed as students complete aptitude practice, solve coding problems, or take mock assessments."
          action={
            <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
              <Button
                variant="primary"
                onClick={() => navigate('/aptitude')}
              >
                Practice Aptitude
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/coding')}
              >
                Solve Coding
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/mock-tests')}
              >
                Take Mock Test
              </Button>
            </div>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Section 2 & 3: Current User Position & Metrics Summary */}
          {currentUserEntry ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Your Standing"
                value={`#${currentUserEntry.rank}`}
                subtext="Overall campus rank"
                icon={<TrophyIcon className="w-4 h-4 text-blue-600" />}
              />
              <StatCard
                label="Your Points"
                value={(currentUserEntry.score ?? 0).toLocaleString()}
                subtext="Total merit points"
                icon={<ChartBarIcon className="w-4 h-4 text-emerald-600" />}
              />
              <StatCard
                label="Coding Solved"
                value={currentUserEntry.stats?.codingAccepted || 0}
                subtext="Accepted solutions"
                icon={<CodingIcon className="w-4 h-4 text-indigo-600" />}
              />
              <StatCard
                label="Mocks Completed"
                value={currentUserEntry.stats?.testsCompleted || 0}
                subtext="Completed tests"
                icon={<MockTestIcon className="w-4 h-4 text-rose-500" />}
              />
            </div>
          ) : (
            <Card className="border-slate-200/80 bg-white shadow-xs">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Your Ranking Status
                  </h4>
                  <p className="text-xs text-slate-600 mt-0.5 max-w-xl leading-relaxed">
                    You have not recorded ranked activity yet. Complete aptitude sessions, solve coding challenges, or finish mock assessments to appear on the campus leaderboard.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate('/aptitude')}
                  >
                    Start Practicing
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section 4: Leaderboard Table */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Rankings Directory
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ordered descending by total merit points.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 font-mono">
                {totalActive} {totalActive === 1 ? 'Candidate' : 'Candidates'}
              </span>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 text-center">Rank</TableHead>
                      <TableHead>Candidate</TableHead>
                      <TableHead>Institution</TableHead>
                      <TableHead className="text-center">Aptitude Correct</TableHead>
                      <TableHead className="text-center">Coding Solved</TableHead>
                      <TableHead className="text-center">Mock Tests</TableHead>
                      <TableHead className="text-right">Total Points</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((item) => {
                      const isCurrentUser = currentUserId && item.id?.toString() === currentUserId;
                      const isRank1 = item.rank === 1;
                      const isRank2 = item.rank === 2;
                      const isRank3 = item.rank === 3;

                      // Restrained background treatment based on ranking
                      let rowClass = 'hover:bg-slate-50/60 transition-colors';
                      if (isCurrentUser) {
                        rowClass = 'bg-blue-50/70 border-l-4 border-l-blue-600 hover:bg-blue-50/90 font-medium';
                      } else if (isRank1) {
                        rowClass = 'bg-amber-50/30 hover:bg-amber-50/60';
                      } else if (isRank2) {
                        rowClass = 'bg-slate-50/50 hover:bg-slate-50/80';
                      } else if (isRank3) {
                        rowClass = 'bg-amber-50/15 hover:bg-amber-50/40';
                      }

                      return (
                        <TableRow key={item.id} className={rowClass}>
                          {/* Rank Column */}
                          <TableCell className="text-center font-mono">
                            {isRank1 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200">
                                01
                              </span>
                            ) : isRank2 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-slate-200 text-slate-700 text-xs font-bold border border-slate-300">
                                02
                              </span>
                            ) : isRank3 ? (
                              <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-amber-50 text-amber-700 text-xs font-bold border border-amber-300/80">
                                03
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 font-semibold">
                                #{String(item.rank).padStart(2, '0')}
                              </span>
                            )}
                          </TableCell>

                          {/* Candidate Identity */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <span className="text-sm font-semibold text-slate-900">
                                {item.displayName}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="primary" size="sm">
                                  You
                                </Badge>
                              )}
                            </div>
                          </TableCell>

                          {/* Institution */}
                          <TableCell className="text-xs text-slate-500 truncate max-w-[200px]">
                            {item.college || 'Engineering Institute'}
                          </TableCell>

                          {/* Aptitude Correct */}
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {item.stats?.aptitudeCorrect ?? 0}
                          </TableCell>

                          {/* Coding Solved */}
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {item.stats?.codingAccepted ?? 0}
                          </TableCell>

                          {/* Mock Tests Completed */}
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {item.stats?.testsCompleted ?? 0}
                          </TableCell>

                          {/* Total Points */}
                          <TableCell className="text-right font-mono font-bold text-blue-600 text-sm sm:text-base">
                            {(item.score ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
