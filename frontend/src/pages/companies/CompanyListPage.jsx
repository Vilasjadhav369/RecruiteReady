import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCompanies } from '../../services/companyService.js';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  SearchInput,
  Select,
  SkeletonCard,
  ErrorState,
  EmptyState,
} from '../../components/ui/index.js';
import {
  CompanyIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FilterIcon,
  CheckCircleIcon,
} from '../../components/ui/Icons.jsx';

export default function CompanyListPage() {
  const navigate = useNavigate();

  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCompanies({
        search: search.trim() || undefined,
        industry: industry === 'all' ? undefined : industry,
        page,
        limit: 12,
      });
      setCompanies(data?.companies || []);
      setPagination(data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 });
    } catch (err) {
      console.error('Failed to load companies:', err);
      setError('Unable to load company preparation tracks. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [search, industry, page]);

  // Reset to page 1 whenever filter or search query changes
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearch('');
    setPage(1);
  };

  const handleIndustryChange = (e) => {
    setIndustry(e.target.value);
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setSearch('');
    setIndustry('all');
    setPage(1);
  };

  const isFiltered = Boolean(search.trim() || (industry && industry !== 'all'));

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Company Preparation' },
  ];

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Company Preparation"
        description="Explore company-specific preparation paths, hiring patterns, and interview topics."
        breadcrumbs={breadcrumbs}
        badge={
          pagination.total > 0 ? (
            <Badge variant="default">{pagination.total} {pagination.total === 1 ? 'Company' : 'Companies'}</Badge>
          ) : null
        }
      />

      {/* Search and Filters Toolbar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              placeholder="Search companies by name or role..."
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-full sm:w-56">
              <select
                id="company-industry-filter"
                value={industry}
                onChange={handleIndustryChange}
                aria-label="Filter by industry"
                className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all cursor-pointer"
              >
                <option value="all">All Industries</option>
                <option value="IT Services & Consulting">IT Services & Consulting</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Big Tech & Cloud Computing">Product & Big Tech</option>
                <option value="Financial Technology">Financial Technology</option>
                <option value="E-Commerce & Retail">E-Commerce & Retail</option>
              </select>
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Reset Filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Grid Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorState
            title="Unable to load companies."
            message={error}
            onRetry={fetchCompanies}
          />
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<CompanyIcon className="w-6 h-6 text-slate-400" />}
          title={isFiltered ? 'No matching companies found' : 'No companies available yet'}
          description={
            isFiltered
              ? 'Try modifying your search keywords or choosing a different industry filter.'
              : 'Company preparation tracks and hiring patterns will appear here once configured.'
          }
          action={
            isFiltered ? (
              <Button variant="outline" onClick={handleClearAllFilters}>
                Clear All Filters
              </Button>
            ) : (
              <Button variant="primary" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((c) => {
              const initial = c.name ? c.name.charAt(0).toUpperCase() : 'C';
              const selectionCount = c.selectionProcess?.length || 0;

              return (
                <Card
                  key={c._id}
                  hoverable
                  onClick={() => navigate(`/companies/${c.slug || c._id}`)}
                  className="group flex flex-col justify-between transition-all duration-200 hover:border-slate-300"
                >
                  <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                    <div className="space-y-3.5">
                      {/* Company Header Row */}
                      <div className="flex items-start gap-3.5">
                        {c.logoUrl ? (
                          <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/90 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                            <img
                              src={c.logoUrl}
                              alt={c.name}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) {
                                  e.target.nextSibling.style.display = 'flex';
                                }
                              }}
                            />
                            <div
                              style={{ display: 'none' }}
                              className="w-full h-full rounded-lg bg-blue-50 text-blue-700 font-bold text-sm items-center justify-center"
                            >
                              {initial}
                            </div>
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200/60 text-blue-700 font-bold text-sm flex items-center justify-center shrink-0 shadow-2xs">
                            {initial}
                          </div>
                        )}

                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                            {c.name}
                          </h3>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {c.industry || 'Enterprise'}
                          </p>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[2rem]">
                        {c.description || 'Comprehensive campus recruitment assessment track and preparation guide.'}
                      </p>

                      {/* Rounds / Stages Badge */}
                      {selectionCount > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700">
                            {selectionCount} Selection {selectionCount === 1 ? 'Round' : 'Rounds'}
                          </span>
                        </div>
                      )}

                      {/* Typical Roles */}
                      {c.roles && c.roles.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Target Roles
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {c.roles.slice(0, 2).map((role, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200/80 text-slate-700 text-[11px] font-medium truncate max-w-[190px]"
                              >
                                {role}
                              </span>
                            ))}
                            {c.roles.length > 2 && (
                              <span className="text-[11px] text-slate-400 self-center font-medium">
                                +{c.roles.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <Button
                        variant="outline"
                        fullWidth
                        size="sm"
                        iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/companies/${c.slug || c._id}`);
                        }}
                        className="group-hover:border-blue-300 group-hover:text-blue-700"
                      >
                        View Preparation
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-2 py-4 border-t border-slate-200">
              <span className="text-xs text-slate-500 font-medium">
                Page {pagination.page} of {pagination.pages} ({pagination.total} total)
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  iconLeft={<ChevronLeftIcon className="w-3.5 h-3.5" />}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= pagination.pages}
                  iconRight={<ChevronRightIcon className="w-3.5 h-3.5" />}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
