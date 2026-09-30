import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCompanies } from '../../services/companyService.js';

export default function CompanyListPage() {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setLoading(true);
        const data = await getCompanies({
          search,
          industry: industry === 'all' ? undefined : industry,
          page: pagination.page,
          limit: 12,
        });
        setCompanies(data?.companies || []);
        setPagination(data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 });
      } catch (err) {
        console.error('Failed to load companies:', err);
        setError('Failed to load company preparation tracks.');
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, [search, industry, pagination.page]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            Hiring Tracks
          </span>
          <span className="text-xs text-slate-500 font-medium">
            {pagination.total} Partner & Target Companies
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Company Preparation
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Target enterprise recruitment syllabus, eligibility cutoffs, and company-specific rounds.
        </p>
      </div>

      {/* Filter */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company name, hiring role..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          />
        </div>

        <div className="w-full sm:w-48">
          <select
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="all">All Industries</option>
            <option value="IT Services & Consulting">IT Services</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Big Tech & Cloud Computing">Product & Big Tech</option>
          </select>
        </div>
      </div>

      {/* Grid Cards */}
      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-3 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-xs text-slate-500 font-medium">Loading companies...</p>
        </div>
      ) : error ? (
        <div className="p-8 text-center text-xs text-rose-600 bg-white rounded-2xl border border-slate-200">{error}</div>
      ) : companies.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-12 h-12 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-slate-900 mb-1">No companies have been added yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hiring tracks and patterns will appear here once configured by administrators.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {companies.map((c) => (
            <div
              key={c._id}
              className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.name}</h3>
                    <span className="text-[11px] text-slate-500">{c.industry}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                  {c.description}
                </p>

                {/* Roles */}
                <div className="space-y-1 mb-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Typical Roles
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {(c.roles || []).slice(0, 2).map((r, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-[10px] font-medium"
                      >
                        {r}
                      </span>
                    ))}
                    {(c.roles || []).length > 2 && (
                      <span className="text-[10px] text-slate-400 self-center">
                        +{c.roles.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Link
                to={`/companies/${c.slug || c._id}`}
                className="w-full text-center py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold rounded-xl border border-slate-200 transition"
              >
                View Hiring Track
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
