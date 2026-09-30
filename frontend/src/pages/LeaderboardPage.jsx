import React, { useState, useEffect } from 'react';
import { getLeaderboard } from '../services/leaderboardService.js';

export default function LeaderboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const result = await getLeaderboard();
        setData(result);
      } catch (err) {
        console.error('Failed to load leaderboard:', err);
        setError('Unable to load leaderboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const leaderboard = data?.leaderboard || [];
  const formula = data?.formula || 'Points = (Aptitude Correct * 10) + (Mock Test Score) + (Accepted Coding Problems * 25)';
  const totalActive = data?.totalActiveParticipants || leaderboard.length;

  const topThree = leaderboard.slice(0, 3);
  const restList = leaderboard.slice(3);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Leaderboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time merit rankings derived strictly from validated test attempts and accepted coding solutions.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 px-3.5 py-1.5 rounded-lg shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-700">Live Active Rankings</span>
        </div>
      </div>

      {/* Transparent Formula Banner */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl text-xs text-blue-900 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
            fx
          </div>
          <div>
            <span className="font-bold text-blue-950 uppercase tracking-wider block text-[10px]">
              Merit Scoring Formula
            </span>
            <span className="font-mono text-blue-800 text-xs font-medium">{formula}</span>
          </div>
        </div>
        <div className="text-[11px] text-blue-700 bg-white/70 px-3 py-1.5 rounded-md border border-blue-200/50 self-start md:self-auto">
          Strictly verified scores &bull; Zero synthetic activity
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500">Calculating real-time participant standings...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      ) : leaderboard.length === 0 ? (
        /* Empty State */
        <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            🏆
          </div>
          <h3 className="text-base font-semibold text-slate-800">No Ranked Participants Yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            The leaderboard dynamically computes rankings from student activity. Solve coding problems, complete aptitude tests, or take mock exams to earn points and claim your spot!
          </p>
        </div>
      ) : (
        <>
          {/* Podium for Top 3 */}
          {topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* Silver / 2nd */}
              {topThree[1] && (
                <div className="order-2 md:order-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition relative flex flex-col items-center text-center">
                  <div className="absolute top-3 right-3 text-xs font-bold text-slate-400">#2</div>
                  <div className="w-14 h-14 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center text-xl font-bold mb-3 shadow-inner">
                    🥈
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{topThree[1].displayName}</h4>
                  <p className="text-[11px] text-slate-500 mb-3 truncate max-w-[180px]">{topThree[1].college}</p>
                  <div className="text-xl font-extrabold text-slate-800 font-mono">
                    {topThree[1].score.toLocaleString()}{' '}
                    <span className="text-xs font-medium text-slate-400">pts</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 w-full text-[10px] text-slate-500">
                    <div>
                      <div className="font-bold text-slate-700">{topThree[1].stats?.aptitudeCorrect || 0}</div>
                      <div>Apt</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">{topThree[1].stats?.codingAccepted || 0}</div>
                      <div>Code</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">{topThree[1].stats?.testsCompleted || 0}</div>
                      <div>Mocks</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Gold / 1st */}
              {topThree[0] && (
                <div className="order-1 md:order-2 bg-gradient-to-b from-amber-50/50 to-white border-2 border-amber-300 rounded-xl p-6 shadow-md hover:shadow-lg transition relative flex flex-col items-center text-center transform md:-translate-y-2">
                  <div className="absolute -top-3 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow">
                    Leader
                  </div>
                  <div className="w-16 h-16 rounded-full bg-amber-100 border-2 border-amber-400 text-amber-700 flex items-center justify-center text-2xl font-bold mb-3 shadow-inner">
                    👑
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">{topThree[0].displayName}</h4>
                  <p className="text-xs text-slate-500 mb-3 truncate max-w-[200px]">{topThree[0].college}</p>
                  <div className="text-2xl font-black text-amber-600 font-mono">
                    {topThree[0].score.toLocaleString()}{' '}
                    <span className="text-xs font-semibold text-slate-500">pts</span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-amber-100 grid grid-cols-3 gap-1 w-full text-xs text-slate-600">
                    <div>
                      <div className="font-bold text-slate-800">{topThree[0].stats?.aptitudeCorrect || 0}</div>
                      <div className="text-[10px] text-slate-400">Apt Correct</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{topThree[0].stats?.codingAccepted || 0}</div>
                      <div className="text-[10px] text-slate-400">Code Solved</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{topThree[0].stats?.testsCompleted || 0}</div>
                      <div className="text-[10px] text-slate-400">Mocks</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bronze / 3rd */}
              {topThree[2] && (
                <div className="order-3 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow transition relative flex flex-col items-center text-center">
                  <div className="absolute top-3 right-3 text-xs font-bold text-amber-700/60">#3</div>
                  <div className="w-14 h-14 rounded-full bg-amber-50 border-2 border-amber-700/40 text-amber-800 flex items-center justify-center text-xl font-bold mb-3 shadow-inner">
                    🥉
                  </div>
                  <h4 className="font-semibold text-slate-900 text-sm">{topThree[2].displayName}</h4>
                  <p className="text-[11px] text-slate-500 mb-3 truncate max-w-[180px]">{topThree[2].college}</p>
                  <div className="text-xl font-extrabold text-slate-800 font-mono">
                    {topThree[2].score.toLocaleString()}{' '}
                    <span className="text-xs font-medium text-slate-400">pts</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-3 gap-1 w-full text-[10px] text-slate-500">
                    <div>
                      <div className="font-bold text-slate-700">{topThree[2].stats?.aptitudeCorrect || 0}</div>
                      <div>Apt</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">{topThree[2].stats?.codingAccepted || 0}</div>
                      <div>Code</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700">{topThree[2].stats?.testsCompleted || 0}</div>
                      <div>Mocks</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Full Standings Table */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 text-sm">Overall Rankings</h3>
              <span className="text-xs text-slate-500">
                Total Participants: <strong className="text-slate-800">{totalActive}</strong>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-16 text-center">Rank</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">College</th>
                    <th className="py-3 px-4 text-center">Aptitude Correct</th>
                    <th className="py-3 px-4 text-center">Coding Solved</th>
                    <th className="py-3 px-4 text-center">Mocks</th>
                    <th className="py-3 px-4 text-right">Total Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaderboard.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                        {item.rank === 1 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 text-xs">
                            1
                          </span>
                        ) : item.rank === 2 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-200 text-slate-700 text-xs">
                            2
                          </span>
                        ) : item.rank === 3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-700 border border-amber-300 text-xs">
                            3
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs font-mono">#{item.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.displayName}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs truncate max-w-[200px]">
                        {item.college || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-700">
                        {item.stats?.aptitudeCorrect || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-700">
                        {item.stats?.codingAccepted || 0}
                      </td>
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-slate-700">
                        {item.stats?.testsCompleted || 0}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-indigo-600 text-base">
                        {item.score.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
