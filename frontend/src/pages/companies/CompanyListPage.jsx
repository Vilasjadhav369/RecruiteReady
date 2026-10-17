import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useDebouncedValue } from '../../hooks/useDebouncedValue.js';
import { useNavigate, Link } from 'react-router-dom';
import { getCompanies, toggleTargetCompany } from '../../services/companyService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  PageHeader,
  Card,
  CardContent,
  Badge,
  Button,
  SearchInput,
  SkeletonCard,
  ErrorState,
  EmptyState,
} from '../../components/ui/index.js';
import {
  CompanyIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BookmarkIcon,
  CheckCircleIcon,
  AptitudeIcon,
  CodingIcon,
  DocumentIcon,
  SparklesIcon,
} from '../../components/ui/Icons.jsx';
import BookmarkButton from '../../components/bookmarks/BookmarkButton.jsx';

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return 'CO';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

export default function CompanyListPage() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [targetOnly, setTargetOnly] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebouncedValue(search.trim(), 300);
  const queryKey = ['companies', { search: debouncedSearch, industry, targetOnly, page }];

  const { data, isLoading: loading, isError, refetch: fetchCompanies } = useQuery({
    queryKey,
    queryFn: () =>
      getCompanies({
        search: debouncedSearch || undefined,
        industry: industry === 'all' ? undefined : industry,
        targetOnly: targetOnly ? 'true' : undefined,
        page,
        limit: 12,
      }),
    placeholderData: keepPreviousData,
  });

  const companies = data?.companies || [];
  const pagination = data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 };
  const error = isError ? 'Something went wrong while loading company recruitment profiles.' : null;
  const [availableIndustries, setAvailableIndustries] = useState([]);

  useEffect(() => {
    if (data?.availableIndustries) setAvailableIndustries(data.availableIndustries);
  }, [data]);

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
    setTargetOnly(false);
    setPage(1);
  };

  const handleToggleTarget = async (e, company) => {
    e.preventDefault();
    e.stopPropagation();
    if (togglingId) return;

    try {
      setTogglingId(company._id);
      const res = await toggleTargetCompany(company._id);
      if (res?.user && updateUser) {
        updateUser(res.user);
      }
      queryClient.setQueryData(queryKey, (prev) =>
        prev
          ? {
              ...prev,
              companies: prev.companies.map((c) =>
                c._id === company._id ? { ...c, isTarget: res.isTarget } : c
              ),
            }
          : prev
      );
    } catch (err) {
      console.error('Failed to toggle target company:', err);
    } finally {
      setTogglingId(null);
    }
  };

  const isFiltered = Boolean(search.trim() || (industry && industry !== 'all') || targetOnly);

  const breadcrumbs = [
    { label: 'Student Dashboard', to: '/dashboard' },
    { label: 'Companies' },
  ];

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* ── Page Header ── */}
      <PageHeader
        title="Company Preparation Tracks"
        description="Explore verified campus recruitment criteria, selection rounds, and structured preparation paths."
        breadcrumbs={breadcrumbs}
        badge={
          pagination.total > 0 ? (
            <Badge variant="primary" size="sm">
              {pagination.total} {pagination.total === 1 ? 'Company' : 'Companies'}
            </Badge>
          ) : null
        }
      />

      {/* ── Search and Filters Toolbar ── */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              placeholder="Search by company name, role, topic, or industry..."
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Target Filter Button */}
            <button
              type="button"
              onClick={() => {
                setTargetOnly((prev) => !prev);
                setPage(1);
              }}
              className={`h-9 px-3 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 cursor-pointer ${
                targetOnly
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <BookmarkIcon className={`w-3.5 h-3.5 ${targetOnly ? 'text-white' : 'text-slate-400'}`} />
              <span>Target Companies</span>
            </button>

            {/* Industry Selector */}
            <div className="w-full sm:w-56">
              <select
                id="company-industry-filter"
                value={industry}
                onChange={handleIndustryChange}
                aria-label="Filter by industry"
                className="w-full h-9 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all cursor-pointer"
              >
                <option value="all">All Industries</option>
                {availableIndustries.map((ind) => (
                  <option key={ind} value={ind}>
                    {ind}
                  </option>
                ))}
              </select>
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAllFilters}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Content Area ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <div className="p-6">
          <ErrorState
            title="Unable to load companies"
            message={error}
            onRetry={fetchCompanies}
          />
        </div>
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<CompanyIcon className="w-8 h-8 text-slate-400" />}
          title={isFiltered ? 'No companies match your filters' : 'No companies available yet'}
          description={
            isFiltered
              ? 'Try adjusting your search keywords or clear selected filters to see all available companies.'
              : 'Company preparation tracks will appear here once published by the placement team.'
          }
          action={
            isFiltered ? (
              <Button variant="outline" size="sm" onClick={handleClearAllFilters}>
                Clear filters
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => navigate('/dashboard')}>
                Return to Dashboard
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((c) => {
              const initials = getInitials(c.name);
              const isTarget = Boolean(c.isTarget || (user?.targetCompanies || []).includes(c.name));

              const hasAptitude = Array.isArray(c.aptitudeTopics) && c.aptitudeTopics.length > 0;
              const hasCoding = Array.isArray(c.codingTopics) && c.codingTopics.length > 0;
              const hasInterview = Array.isArray(c.interviewTopics) && c.interviewTopics.length > 0;
              const hasResources = Array.isArray(c.resources) && c.resources.length > 0;

              return (
                <Card
                  key={c._id}
                  className="group flex flex-col justify-between transition-all duration-200 hover:border-slate-300 hover:shadow-xs border-slate-200/80 bg-white"
                >
                  <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                    <div className="space-y-3.5">
                      {/* Company Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {c.logoUrl ? (
                            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                              <img
                                src={c.logoUrl}
                                alt={c.name}
                                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  if (e.target.nextSibling) {
                                    e.target.nextSibling.style.display = 'flex';
                                  }
                                }}
                              />
                              <div
                                style={{ display: 'none' }}
                                className="w-full h-full rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs items-center justify-center"
                              >
                                {initials}
                              </div>
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {initials}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <Link
                                to={`/companies/${c.slug || c._id}`}
                                className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors block truncate hover:underline"
                              >
                                {c.name}
                              </Link>
                              {c.isFeatured && (
                                <span title="Featured Company" className="text-amber-500">
                                  <SparklesIcon className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {c.industry || 'Technology'}
                            </p>
                          </div>
                        </div>

                        {/* Top Action Icons: Bookmark & Target */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <BookmarkButton
                            itemType="company"
                            itemId={c._id}
                            initialBookmarked={c.isBookmarked}
                            variant="icon-only"
                            size="sm"
                          />
                          <button
                            type="button"
                            onClick={(e) => handleToggleTarget(e, c)}
                            disabled={togglingId === c._id}
                            className={`min-w-[34px] min-h-[34px] p-1.5 rounded-lg border transition-colors flex items-center justify-center cursor-pointer ${
                              isTarget
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100'
                                : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 shadow-2xs'
                            }`}
                            aria-label={isTarget ? `Remove ${c.name} from targets` : `Add ${c.name} to targets`}
                            title={isTarget ? 'Target Company (Click to remove)' : 'Add to Target Companies'}
                          >
                            <CheckCircleIcon className={`w-4 h-4 ${isTarget ? 'text-emerald-600' : 'text-slate-300'}`} />
                          </button>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[2rem]">
                        {c.description || 'Comprehensive campus recruitment assessment track and preparation guide.'}
                      </p>

                      {/* Available Preparation Areas (Phase 4) */}
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Preparation Track Areas
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {hasAptitude && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                              <AptitudeIcon className="w-3 h-3 text-emerald-600" />
                              Aptitude
                            </span>
                          )}
                          {hasCoding && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-800 border border-slate-200/70">
                              <CodingIcon className="w-3 h-3 text-slate-700" />
                              Coding
                            </span>
                          )}
                          {hasInterview && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-800 border border-blue-200/60">
                              <DocumentIcon className="w-3 h-3 text-blue-600" />
                              Interview
                            </span>
                          )}
                          {hasResources && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-purple-50 text-purple-800 border border-purple-200/60">
                              Resources
                            </span>
                          )}
                          {!hasAptitude && !hasCoding && !hasInterview && !hasResources && (
                            <span className="text-[11px] text-slate-400 italic">
                              General Syllabus
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Typical Roles */}
                      {c.roles && c.roles.length > 0 && (
                        <div className="space-y-1 pt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Target Roles
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {c.roles.slice(0, 2).map((role, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-700 text-[11px] font-medium truncate max-w-[190px]"
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

                    {/* Action Button: View Preparation */}
                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                      <Button
                        to={`/companies/${c.slug || c._id}`}
                        variant="primary"
                        fullWidth
                        size="sm"
                        iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                        className="justify-center"
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
