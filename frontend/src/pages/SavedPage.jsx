import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookmarkFilledIcon,
  SearchIcon,
  TrashIcon,
  ExternalLinkIcon,
  CompanyIcon,
  CodingIcon,
  ResourcesIcon,
  MockTestIcon,
  RefreshIcon,
  AlertCircleIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '../components/ui/Icons.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardContent } from '../components/ui/Card.jsx';
import bookmarkService from '../services/bookmarkService.js';

const CATEGORY_TABS = [
  { key: 'all', label: 'All Items', icon: BookmarkFilledIcon },
  { key: 'company', label: 'Companies', icon: CompanyIcon },
  { key: 'coding_problem', label: 'Coding Problems', icon: CodingIcon },
  { key: 'study_material', label: 'Study Materials', icon: ResourcesIcon },
  { key: 'mock_test', label: 'Mock Tests', icon: MockTestIcon },
];

function formatRelativeTime(ts) {
  if (!ts) return '';
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Saved just now';
    if (diffMins < 60) return `Saved ${diffMins}m ago`;
    if (diffHours < 24) return `Saved ${diffHours}h ago`;
    if (diffDays === 1) return 'Saved yesterday';
    if (diffDays < 7) return `Saved ${diffDays}d ago`;

    return `Saved ${date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`;
  } catch {
    return '';
  }
}

function getItemBadge(itemType, metaBadge) {
  switch (itemType) {
    case 'company':
      return <Badge variant="brand" size="sm">Company</Badge>;
    case 'coding_problem':
      return <Badge variant="success" size="sm">{metaBadge || 'Problem'}</Badge>;
    case 'study_material':
      return <Badge variant="info" size="sm">{metaBadge || 'Resource'}</Badge>;
    case 'mock_test':
      return <Badge variant="warning" size="sm">Mock Test</Badge>;
    default:
      return <Badge variant="default" size="sm">Saved</Badge>;
  }
}

function getItemIcon(itemType) {
  switch (itemType) {
    case 'company':
      return <CompanyIcon className="w-5 h-5 text-primary" />;
    case 'coding_problem':
      return <CodingIcon className="w-5 h-5 text-emerald-600" />;
    case 'study_material':
      return <ResourcesIcon className="w-5 h-5 text-teal-600" />;
    case 'mock_test':
      return <MockTestIcon className="w-5 h-5 text-amber-600" />;
    default:
      return <BookmarkFilledIcon className="w-5 h-5 text-primary" />;
  }
}

export function SavedPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    items: [],
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
    counts: { all: 0, company: 0, coding_problem: 0, study_material: 0, mock_test: 0 },
  });

  const fetchBookmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bookmarkService.getBookmarks({
        itemType: activeTab === 'all' ? undefined : activeTab,
        page,
        limit: 20,
      });
      setData(
        res || {
          items: [],
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 1,
          counts: { all: 0, company: 0, coding_problem: 0, study_material: 0, mock_test: 0 },
        }
      );
    } catch (err) {
      setError('Unable to load saved bookmarks. Please check your network connection.');
      console.error('[SavedPage] Error fetching bookmarks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, [activeTab, page]);

  const handleRemove = async (itemType, itemId) => {
    try {
      await bookmarkService.removeBookmark(itemType, itemId);
      setData((prev) => {
        const nextItems = prev.items.filter(
          (b) => !(b.itemType === itemType && String(b.itemId) === String(itemId))
        );
        const nextCounts = { ...prev.counts };
        nextCounts.all = Math.max(0, nextCounts.all - 1);
        if (nextCounts[itemType] !== undefined) {
          nextCounts[itemType] = Math.max(0, nextCounts[itemType] - 1);
        }
        return {
          ...prev,
          total: Math.max(0, prev.total - 1),
          items: nextItems,
          counts: nextCounts,
        };
      });
    } catch (err) {
      console.error('[SavedPage] Failed to remove bookmark:', err);
    }
  };

  // Client-side search filtering
  const filteredItems = data.items.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const titleMatch = b.item?.title?.toLowerCase().includes(q);
    const subMatch = b.item?.subtitle?.toLowerCase().includes(q);
    const descMatch = b.item?.description?.toLowerCase().includes(q);
    return titleMatch || subMatch || descMatch;
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block leading-none">
            Personal Library
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <span>Saved Items</span>
            {data.counts.all > 0 && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-tint text-primary-dark">
                {data.counts.all}
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Revisit your bookmarked companies, coding problems, study materials, and mock assessments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBookmarks}
            disabled={loading}
            aria-label="Refresh saved items"
            iconLeft={<RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Tabs & Search Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_TABS.map((tab) => {
            const count = data.counts[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setPage(1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter saved items..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder:text-slate-400 text-slate-800 focus:outline-none focus:border-primary focus:bg-white transition-colors"
          />
        </div>
      </div>

      {/* Content Area */}
      {error ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircleIcon className="w-8 h-8 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Unable to load bookmarks</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchBookmarks}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : loading && data.items.length === 0 ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex gap-4 animate-pulse pb-4 border-b border-slate-100 last:border-0 last:pb-0"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-3/5" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <BookmarkFilledIcon className="w-6 h-6 text-slate-400" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-800">
                {searchQuery
                  ? `No matches for "${searchQuery}"`
                  : activeTab === 'all'
                  ? 'No saved items yet'
                  : `No saved ${CATEGORY_TABS.find((t) => t.key === activeTab)?.label.toLowerCase()} yet`}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                {searchQuery
                  ? 'Try modifying your filter keyword or search across all categories.'
                  : 'Bookmark companies, coding problems, study materials, or mock tests by clicking the bookmark icon on any page.'}
              </p>
            </div>

            {/* Quick Navigation Links */}
            {!searchQuery && (
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <Button to="/companies" variant="outline" size="sm" iconLeft={<CompanyIcon className="w-3.5 h-3.5 text-primary" />}>
                  Companies
                </Button>
                <Button to="/coding" variant="outline" size="sm" iconLeft={<CodingIcon className="w-3.5 h-3.5 text-emerald-600" />}>
                  Coding Problems
                </Button>
                <Button to="/resources" variant="outline" size="sm" iconLeft={<ResourcesIcon className="w-3.5 h-3.5 text-teal-600" />}>
                  Study Materials
                </Button>
                <Button to="/mock-tests" variant="outline" size="sm" iconLeft={<MockTestIcon className="w-3.5 h-3.5 text-amber-600" />}>
                  Mock Tests
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100 list-none m-0 p-0" role="list">
            {filteredItems.map((b) => (
              <li
                key={b.id}
                className="p-4 sm:p-5 flex items-start gap-4 hover:bg-slate-50/70 transition-colors group"
              >
                {/* Category Icon */}
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  {getItemIcon(b.itemType)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    {getItemBadge(b.itemType, b.item?.metaBadge)}
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatRelativeTime(b.createdAt)}
                    </span>
                  </div>

                  <Link
                    to={b.item?.link || '#'}
                    className="text-sm sm:text-base font-bold text-slate-900 hover:text-primary transition-colors block truncate no-underline"
                  >
                    {b.item?.title}
                  </Link>

                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {b.item?.subtitle}
                  </p>

                  {b.item?.description && (
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {b.item.description}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-center">
                  <Link
                    to={b.item?.link || '#'}
                    className="p-2 rounded-lg text-slate-500 hover:text-primary hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    title="Open item"
                    aria-label={`Open ${b.item?.title}`}
                  >
                    <ExternalLinkIcon className="w-4 h-4" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleRemove(b.itemType, b.itemId)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                    title="Remove bookmark"
                    aria-label={`Remove ${b.item?.title} from saved`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>

          {/* Pagination Controls */}
          {data.totalPages > 1 && (
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page <span className="font-semibold text-slate-800">{data.page}</span> of{' '}
                <span className="font-semibold text-slate-800">{data.totalPages}</span> ({data.total} total)
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={data.page <= 1 || loading}
                  iconLeft={<ChevronLeftIcon className="w-3.5 h-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                  disabled={data.page >= data.totalPages || loading}
                  iconRight={<ChevronRightIcon className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default SavedPage;
