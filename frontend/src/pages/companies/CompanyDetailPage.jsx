import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getCompany } from '../../services/companyService.js';

export default function CompanyDetailPage() {
  const { id } = useParams();
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        setLoading(true);
        const data = await getCompany(id);
        setCompany(data);
      } catch (err) {
        console.error('Failed to load company:', err);
        setError('Failed to load company preparation profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompany();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading company recruitment details...</p>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center max-w-md mx-auto">
        <h3 className="text-base font-bold text-slate-900 mb-1">Company Not Found</h3>
        <p className="text-xs text-slate-500 mb-4">{error || 'This hiring track is unavailable.'}</p>
        <Link to="/companies" className="px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-xl">
          Return to Companies
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-xl shrink-0">
            {company.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                {company.industry}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              {company.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {company.website && (
            <a
              href={company.website}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              Official Website
            </a>
          )}
          {company.careersUrl && (
            <a
              href={company.careersUrl}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
            >
              Careers Portal
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Overview & Rounds */}
        <div className="lg:col-span-2 space-y-6">
          {/* About */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              About the Company
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed">
              {company.description || 'No detailed description available.'}
            </p>
          </div>

          {/* Selection Process */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Selection Process & Rounds
            </h2>
            <div className="space-y-3">
              {(company.selectionProcess || []).map((round, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-slate-900 text-white font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-800">{round}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Preparation Topics */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Targeted Preparation Topics
            </h2>

            <div className="space-y-4 text-xs">
              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Aptitude & Reasoning:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(company.aptitudeTopics || []).map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700 font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Coding & Algorithms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(company.codingTopics || []).map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200/60 rounded-lg font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-slate-800 block mb-1.5">Technical & Core CS:</span>
                <div className="flex flex-wrap gap-1.5">
                  {(company.interviewTopics || []).map((t, idx) => (
                    <span key={idx} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/60 rounded-lg font-medium">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Roles, Eligibility, Shortcuts */}
        <div className="space-y-6">
          {/* Eligibility Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Campus Eligibility
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {company.eligibility || 'Standard degree requirements apply.'}
            </p>
          </div>

          {/* Hiring Roles */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Roles Offered
            </h3>
            <div className="space-y-1.5">
              {(company.roles || []).map((role, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-slate-50 rounded-lg text-xs font-semibold text-slate-800 border border-slate-100"
                >
                  {role}
                </div>
              ))}
            </div>
          </div>

          {/* Action Callouts */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-6 text-white space-y-4 shadow-sm">
            <h3 className="text-sm font-bold">Ready to Practice for {company.name}?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Solve algorithmic challenges and timed tests aligned with this company's interview rounds.
            </p>
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/aptitude"
                className="w-full text-center py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl transition"
              >
                Practice Aptitude
              </Link>
              <Link
                to="/coding"
                className="w-full text-center py-2 bg-slate-700 hover:bg-slate-600 text-white font-semibold text-xs rounded-xl transition"
              >
                Practice Coding
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
