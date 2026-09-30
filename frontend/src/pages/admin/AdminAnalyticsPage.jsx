import React, { useState, useEffect } from 'react';
import { getAdminAnalytics } from '../../services/adminService.js';

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const result = await getAdminAnalytics();
        setData(result);
      } catch (err) {
        console.error('Fetch analytics error:', err);
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="p-12 text-center bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Aggregating platform analytics from live data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
        {error}
      </div>
    );
  }

  // Flexibly destructure the analytics response — supports both flat and nested metrics
  const metrics = data?.metrics || data || {};
  const students = metrics.students?.total ?? metrics.totalStudents ?? 0;
  const questions = metrics.aptitude?.questions ?? metrics.aptitudeQuestions ?? 0;
  const codingProblems = metrics.coding?.problems ?? metrics.totalCodingProblems ?? 0;
  const companies = metrics.companies?.total ?? metrics.totalCompanies ?? 0;
  const resources = metrics.resources?.total ?? metrics.totalResources ?? 0;
  const mockTests = metrics.mockTests?.total ?? metrics.totalMockTests ?? 0;
  const reviews = metrics.reviews || {};
  const attempts = {
    aptitude: metrics.aptitude?.attempts ?? 0,
    coding: metrics.coding?.submissions ?? 0,
    mockTests: metrics.mockTests?.attempts ?? 0,
  };

  const summaryCards = [
    { label: 'Students', value: students, color: 'bg-blue-600', emoji: '👤' },
    { label: 'Aptitude Questions', value: questions, color: 'bg-indigo-600', emoji: '📝' },
    { label: 'Coding Problems', value: codingProblems, color: 'bg-violet-600', emoji: '💻' },
    { label: 'Companies', value: companies, color: 'bg-emerald-600', emoji: '🏢' },
    { label: 'Study Resources', value: resources, color: 'bg-teal-600', emoji: '📚' },
    { label: 'Mock Tests', value: mockTests, color: 'bg-amber-600', emoji: '🧪' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Analytics</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time aggregated statistics across all modules — zero synthetic data.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-700">Live Data</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow transition text-center space-y-2"
          >
            <div className="text-2xl">{card.emoji}</div>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {typeof card.value === 'number' ? card.value.toLocaleString() : card.value}
            </div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
              {card.label}
            </div>
          </div>
        ))}
      </div>

      {/* Engagement Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attempts Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-100">
            Activity Breakdown
          </h3>
          <div className="space-y-3">
            {[
              {
                label: 'Aptitude Attempts',
                value: attempts.aptitude,
                bar: 'bg-indigo-500',
              },
              {
                label: 'Coding Submissions',
                value: attempts.coding,
                bar: 'bg-violet-500',
              },
              {
                label: 'Mock Test Attempts',
                value: attempts.mockTests,
                bar: 'bg-amber-500',
              },
            ].map((row) => {
              const maxValue = Math.max(
                attempts.aptitude || 1,
                attempts.coding || 1,
                attempts.mockTests || 1,
                1
              );
              const pct = Math.min(100, (row.value / maxValue) * 100) || 0;
              return (
                <div key={row.label} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slate-600 w-36 shrink-0">{row.label}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${row.bar} transition-all`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-800 font-mono w-10 text-right">
                    {row.value}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews Summary */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="font-bold text-slate-800 text-sm mb-4 pb-2 border-b border-slate-100">
            Reviews Summary
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 bg-amber-50 rounded-lg">
              <div className="text-xl font-black text-amber-700 font-mono">
                {reviews.pending ?? 0}
              </div>
              <div className="text-[10px] font-semibold text-amber-600 uppercase mt-1">Pending</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-lg">
              <div className="text-xl font-black text-emerald-700 font-mono">
                {reviews.approved ?? 0}
              </div>
              <div className="text-[10px] font-semibold text-emerald-600 uppercase mt-1">Approved</div>
            </div>
            <div className="p-3 bg-rose-50 rounded-lg">
              <div className="text-xl font-black text-rose-700 font-mono">
                {(reviews.total ?? 0) - (reviews.approved ?? 0) - (reviews.pending ?? 0)}
              </div>
              <div className="text-[10px] font-semibold text-rose-600 uppercase mt-1">Rejected</div>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-3 text-center">
            Only approved reviews are displayed publicly.
          </p>
        </div>
      </div>

      {/* Data Integrity Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
          ⓘ
        </div>
        <div>
          <strong className="text-slate-800">Data Integrity Promise:</strong> All figures shown here are
          aggregated in real-time from actual student interactions. Zero synthetic data, zero
          fabricated statistics.
        </div>
      </div>
    </div>
  );
}
