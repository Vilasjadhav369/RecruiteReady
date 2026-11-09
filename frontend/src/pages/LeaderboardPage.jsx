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
  Avatar,
  Skeleton,
  SkeletonCard,
  ErrorState,
  EmptyState,
} from '../components/ui/index.js';
import {
  TrophyIcon,
  CodingIcon,
  ChartBarIcon,
  CheckCircleIcon,
  InfoIcon,
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
  const currentUser = data?.currentUser || null;
  const scoringRules = data?.scoringRules || {};
  const totalRanked = data?.totalRankedStudents ?? leaderboard.length;

  const currentUserId = user?._id?.toString() || user?.id?.toString();

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Leaderboard' },
  ];

  return (
    <div className="max-w-[1240px] mx-auto space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Campus Leaderboard"
        description="Merit standings calculated strictly from verified assessment attempts and accepted coding solutions."
        breadcrumbs={breadcrumbs}
        badge={
          totalRanked > 0 ? (
            <Badge variant="brand" dot>
              {totalRanked} {totalRanked === 1 ? 'Ranked Student' : 'Ranked Students'}
            </Badge>
          ) : null
        }
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/aptitude')}
            >
              Practice Aptitude
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/coding')}
            >
              Solve Coding
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

      {/* Main Content States */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <SkeletonCard key={idx} className="h-28" />
            ))}
          </div>
          <Card className="p-6 space-y-4">
            <Skeleton className="h-6 w-48" />
            <div className="space-y-3 pt-2">
              {Array.from({ length: 6 }).map((_, idx) => (
                <Skeleton key={idx} className="h-12 w-full" />
              ))}
            </div>
          </Card>
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorState
            title="Leaderboard couldn't be loaded"
            message={error}
            onRetry={fetchLeaderboard}
          />
        </div>
      ) : leaderboard.length === 0 ? (
        /* Empty State: 0 ranked students in entire platform */
        <EmptyState
          icon={<TrophyIcon className="w-8 h-8 text-primary" />}
          title="No leaderboard data yet"
          description="The leaderboard will appear as students complete aptitude assessments, mock tests, and coding problems."
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
          {/* Section 1: Current User Standing / Performance Summary */}
          {currentUser?.isRanked ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard
                label="Your Standing"
                value={`#${currentUser.rank}`}
                subtext="Campus competition rank"
                icon={<TrophyIcon className="w-4 h-4 text-primary" />}
              />
              <StatCard
                label="Leaderboard Score"
                value={(currentUser.score ?? 0).toLocaleString()}
                subtext="Verified merit points"
                icon={<ChartBarIcon className="w-4 h-4 text-emerald-600" />}
              />
              <StatCard
                label="Completed Activities"
                value={currentUser.completedActivities ?? 0}
                subtext={`${currentUser.aptitudeCompleted || 0} apt • ${currentUser.codingProblemsSolved || 0} code • ${currentUser.mockTestsCompleted || 0} mock`}
                icon={<CheckCircleIcon className="w-4 h-4 text-primary" />}
              />
              <StatCard
                label="Coding Solved"
                value={currentUser.codingProblemsSolved ?? 0}
                subtext="Unique accepted problems"
                icon={<CodingIcon className="w-4 h-4 text-slate-700" />}
              />
            </div>
          ) : (
            <Card className="border-slate-200/80 bg-white shadow-xs">
              <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      Your Ranking Status
                    </span>
                    <Badge variant="neutral">Unranked</Badge>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Complete your first activity to enter the leaderboard
                  </h4>
                  <p className="text-xs text-slate-500 max-w-xl leading-relaxed">
                    Solve coding challenges, complete aptitude practice sessions, or take mock assessments to earn verified merit points and establish your campus standing.
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

          {/* Section 2: Transparent Scoring Rules Banner */}
          <Card className="border-slate-200/80 bg-slate-50/70 shadow-xs">
            <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200/80 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                  fx
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      How Scoring Works
                    </span>
                    <span className="text-[11px] text-slate-400">• Deterministic & Fair</span>
                  </div>
                  <p className="text-xs sm:text-sm font-mono text-slate-800 font-semibold mt-0.5">
                    {scoringRules.formula || 'Score = (Aptitude Sessions × 10) + (Coding Problems Solved × 25) + (Mock Tests × 30)'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 font-medium bg-white px-3 py-1.5 rounded-lg border border-slate-200/80 shrink-0">
                <InfoIcon className="w-3.5 h-3.5 text-primary" />
                <span>Duplicate coding submissions never inflate score</span>
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Top Three Highlight Podium (Rendered strictly if >= 3 real ranked students) */}
          {leaderboard.length >= 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {leaderboard.slice(0, 3).map((item, _idx) => {
                const rankNum = item.rank;
                const isFirst = rankNum === 1;
                const isSecond = rankNum === 2;
                const isCurrentUser = currentUserId && item.student?.id === currentUserId;

                const borderStyle = isFirst
                  ? 'border-emerald-200 bg-primary-soft/60'
                  : 'border-slate-200/80 bg-white';

                const badgeVariant = isFirst ? 'brand' : isSecond ? 'secondary' : 'default';

                return (
                  <Card key={item.student.id} className={`${borderStyle} shadow-xs relative overflow-hidden`}>
                    <CardContent className="p-5 flex flex-col justify-between h-full space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant={badgeVariant} size="lg">
                          Rank #{String(rankNum).padStart(2, '0')}
                        </Badge>
                        {isCurrentUser && (
                          <Badge variant="brand" size="sm">
                            You
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <Avatar
                          name={item.student.displayName}
                          src={item.student.profilePhoto}
                          size="md"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {item.student.displayName}
                          </p>
                          <span className="text-xs text-slate-500">
                            {item.completedActivities} completed {item.completedActivities === 1 ? 'activity' : 'activities'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                        <span className="text-xs text-slate-500">
                          {item.completedActivities} completed {item.completedActivities === 1 ? 'activity' : 'activities'}
                        </span>
                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-bold font-mono text-primary">
                            {item.score.toLocaleString()}
                          </span>
                          <span className="text-xs text-slate-400 font-normal">pts</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Section 4: Full Rankings Directory Table */}
          <Card className="border-slate-200/80 shadow-xs overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-base sm:text-lg">
                  Rankings Directory
                </CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Competition ranking with deterministic tie-breaking based on verified activity.
                </p>
              </div>
              <span className="text-xs font-semibold text-slate-600 font-mono">
                {totalRanked} {totalRanked === 1 ? 'Candidate' : 'Candidates'}
              </span>
            </CardHeader>

            <CardContent className="p-0">
              {/* Desktop Table View (Hidden on very small screens for responsiveness) */}
              <div className="overflow-x-auto hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-20 text-center">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead className="text-center">Aptitude</TableHead>
                      <TableHead className="text-center">Coding Solved</TableHead>
                      <TableHead className="text-center">Mock Tests</TableHead>
                      <TableHead className="text-center">Completed</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {leaderboard.map((item) => {
                      const isCurrentUser = currentUserId && item.student?.id === currentUserId;
                      const isRank1 = item.rank === 1;

                      let rowClass = 'hover:bg-slate-50/60 transition-colors';
                      if (isCurrentUser) {
                        rowClass = 'bg-primary-soft border-l-4 border-l-primary hover:bg-primary-tint/40 font-medium';
                      } else if (isRank1) {
                        rowClass = 'bg-emerald-50/30 hover:bg-emerald-50/50';
                      }

                      return (
                        <TableRow key={item.student.id} className={rowClass}>
                          {/* Rank Column */}
                          <TableCell className="text-center font-mono">
                            {item.rank <= 3 ? (
                              <span
                                className={`inline-flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold border ${
                                  item.rank === 1
                                    ? 'bg-primary-tint text-primary-dark border-primary-border'
                                    : item.rank === 2
                                    ? 'bg-slate-200 text-slate-800 border-slate-300'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}
                              >
                                {String(item.rank).padStart(2, '0')}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-500 font-semibold font-mono">
                                #{String(item.rank).padStart(2, '0')}
                              </span>
                            )}
                          </TableCell>

                          {/* Student Identity with Avatar */}
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                name={item.student.displayName}
                                src={item.student.profilePhoto}
                                size="sm"
                              />
                              <span className="text-sm font-semibold text-slate-900">
                                {item.student.displayName}
                              </span>
                              {isCurrentUser && (
                                <Badge variant="brand" size="sm">
                                  You
                                </Badge>
                              )}
                            </div>
                          </TableCell>


                          {/* Aptitude Sessions */}
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {item.aptitudeCompleted} <span className="text-[10px] text-slate-400">sess</span>
                          </TableCell>

                          {/* Coding Solved */}
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {item.codingProblemsSolved} <span className="text-[10px] text-slate-400">prob</span>
                          </TableCell>

                          {/* Mock Tests Completed */}
                          <TableCell className="text-center font-mono text-xs text-slate-700">
                            {item.mockTestsCompleted} <span className="text-[10px] text-slate-400">tests</span>
                          </TableCell>

                          {/* Total Completed */}
                          <TableCell className="text-center font-mono text-xs font-semibold text-slate-800">
                            {item.completedActivities}
                          </TableCell>

                          {/* Leaderboard Score */}
                          <TableCell className="text-right font-mono font-bold text-primary text-sm sm:text-base">
                            {(item.score ?? 0).toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card / List View (For screens under 640px) */}
              <div className="sm:hidden divide-y divide-slate-100">
                {leaderboard.map((item) => {
                  const isCurrentUser = currentUserId && item.student?.id === currentUserId;
                  const isRank1 = item.rank === 1;

                  return (
                    <div
                      key={item.student.id}
                      className={`p-4 space-y-3 ${
                        isCurrentUser ? 'bg-primary-soft border-l-4 border-l-primary' : isRank1 ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            #{item.rank}
                          </span>
                          <Avatar
                            name={item.student.displayName}
                            src={item.student.profilePhoto}
                            size="sm"
                          />
                          <div>
                            <span className="text-sm font-semibold text-slate-900 block">
                              {item.student.displayName}
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-base font-bold font-mono text-primary block">
                            {item.score.toLocaleString()} <span className="text-xs font-normal text-slate-400">pts</span>
                          </span>
                          {isCurrentUser && (
                            <Badge variant="brand" size="sm" className="mt-0.5">
                              You
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 bg-slate-50/70 p-2 rounded-lg font-mono">
                        <span>Aptitude: {item.aptitudeCompleted}</span>
                        <span>Coding: {item.codingProblemsSolved}</span>
                        <span>Mocks: {item.mockTestsCompleted}</span>
                        <span className="font-bold text-slate-700">Total: {item.completedActivities}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
