import React, { useState, useEffect } from 'react';
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
  FilterIcon,
  BookmarkIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '../../components/ui/Icons.jsx';

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

  const [companies, setCompanies] = useState([]);
  const [availableIndustries, setAvailableIndustries] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [industry, setIndustry] = useState('all');
  const [targetOnly, setTargetOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getCompanies({
        search: search.trim() || undefined,
        industry: industry === 'all' ? undefined : industry,
        targetOnly: targetOnly ? 'true' : undefined,
        page,
        limit: 12,
      });
      setCompanies(data?.companies || []);
      if (data?.availableIndustries) {
        setAvailableIndustries(data.availableIndustries);
      }
      setPagination(data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 });
    } catch (err) {
      console.error('Failed to load companies:', err);
      setError('Something went wrong while loading company information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [search, industry, targetOnly, page]);

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
      // Update local card state synchronously
      setCompanies((prev) =>
        prev.map((c) => (c._id === company._id ? { ...c, isTarget: res.isTarget } : c))
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
        title="Companies"
        description="Explore companies and prepare with focused resources."
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
      <Card className="border-slate-200 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              placeholder="Search companies..."
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
                  ? 'bg-brand text-white border-brand'
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
                className="w-full h-9 px-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all cursor-pointer"
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
          title={isFiltered ? 'No companies match your search' : 'No companies available yet'}
          description={
            isFiltered
              ? 'Try another company name or clear your filters.'
              : 'Companies will appear here once they are added by the placement team.'
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
              const selectionCount = c.selectionProcess?.length || 0;
              const isTarget = c.isTarget || (user?.targetCompanies || []).includes(c.name);

              return (
                <Card
                  key={c._id}
                  className="group flex flex-col justify-between transition-all duration-200 hover:border-slate-300 hover:shadow-xs border-slate-200"
                >
                  <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                    <div className="space-y-3.5">
                      {/* Company Header Row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          {c.logoUrl ? (
                            <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
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
                                className="w-full h-full rounded-lg bg-[#DCFCE7] text-brand-dark font-bold text-xs items-center justify-center"
                              >
                                {initials}
                              </div>
                            </div>
                          ) : (
                            <div className="w-11 h-11 rounded-xl bg-[#DCFCE7] border border-[#BBF7D0] text-brand-dark font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs">
                              {initials}
                            </div>
                          )}

                          <div className="min-w-0 flex-1">
                            <Link
                              to={`/companies/${c.slug || c._id}`}
                              className="text-base font-bold text-slate-900 group-hover:text-brand-dark transition-colors block truncate hover:underline"
                            >
                              {c.name}
                            </Link>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {c.industry || 'Technology'}
                            </p>
                          </div>
                        </div>

                        {/* Target Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleTarget(e, c)}
                          disabled={togglingId === c._id}
                          className={`p-1.5 rounded-lg border transition-colors shrink-0 cursor-pointer ${
                            isTarget
                              ? 'bg-[#DCFCE7] border-[#86EFAC] text-brand-dark hover:bg-emerald-100'
                              : 'bg-white border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300'
                          }`}
                          aria-label={isTarget ? `Remove ${c.name} from targets` : `Add ${c.name} to targets`}
                          title={isTarget ? 'Target Company (Click to remove)' : 'Add to Target Companies'}
                        >
                          <BookmarkIcon className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Description */}
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed min-h-[2rem]">
                        {c.description || 'Comprehensive campus recruitment assessment track and preparation guide.'}
                      </p>

                      {/* Selection Rounds Badge */}
                      <div className="flex items-center gap-2 pt-0.5">
                        {selectionCount > 0 && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            {selectionCount} Selection {selectionCount === 1 ? 'Round' : 'Rounds'}
                          </span>
                        )}
                        {isTarget && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#DCFCE7] text-brand-dark border border-[#BBF7D0]">
                            <CheckCircleIcon className="w-3 h-3 text-brand" />
                            Target
                          </span>
                        )}
                      </div>

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

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100">
                      <Link to={`/companies/${c.slug || c._id}`} className="block">
                        <Button
                          variant="outline"
                          fullWidth
                          size="sm"
                          iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
                        >
                          View Company
                        </Button>
                      </Link>
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
