import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getResources } from '../../services/resourceService.js';
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
  BookOpenIcon,
  DocumentIcon,
  PlayIcon,
  EditIcon,
  ExternalLinkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '../../components/ui/Icons.jsx';

export default function ResourceListPage() {
  const navigate = useNavigate();

  const [resources, setResources] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 12, pages: 1 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getResources({
        search: search.trim() || undefined,
        category: category === 'all' ? undefined : category,
        type: type === 'all' ? undefined : type,
        page,
        limit: 12,
      });

      setResources(data?.resources || []);
      if (Array.isArray(data?.categories) && data.categories.length > 0) {
        setCategories(data.categories);
      }
      setPagination(data?.pagination || { total: 0, page: 1, limit: 12, pages: 1 });
    } catch (err) {
      console.error('Failed to load study materials:', err);
      setError('Unable to load study materials. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [search, category, type, page]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleSearchClear = () => {
    setSearch('');
    setPage(1);
  };

  const handleCategorySelect = (selectedCategory) => {
    setCategory(selectedCategory);
    setPage(1);
  };

  const handleTypeChange = (e) => {
    setType(e.target.value);
    setPage(1);
  };

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setType('all');
    setPage(1);
  };

  const isFiltered = Boolean(search.trim() || (category && category !== 'all') || (type && type !== 'all'));

  const breadcrumbs = [
    { label: 'Student Dashboard', href: '/dashboard' },
    { label: 'Study Materials' },
  ];

  const getFormatBadge = (formatType) => {
    const norm = (formatType || '').toLowerCase();
    switch (norm) {
      case 'pdf':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            <DocumentIcon className="w-3 h-3 text-rose-600" />
            PDF
          </span>
        );
      case 'video':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-sky-700 border border-sky-200/80">
            <PlayIcon className="w-3 h-3 text-sky-600" />
            Video
          </span>
        );
      case 'article':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-primary-tint text-primary-dark border border-primary-border">
            <BookOpenIcon className="w-3 h-3 text-primary" />
            Article
          </span>
        );
      case 'note':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            <EditIcon className="w-3 h-3 text-amber-600" />
            Notes
          </span>
        );
      case 'link':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/80">
            <ExternalLinkIcon className="w-3 h-3 text-slate-500" />
            Link
          </span>
        );
    }
  };

  return (
    <div className="max-w-[1240px] mx-auto space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Study Materials"
        description="Curated reference materials and guides to strengthen your technical and placement preparation."
        breadcrumbs={breadcrumbs}
        badge={
          pagination.total > 0 ? (
            <Badge variant="brand">{pagination.total} {pagination.total === 1 ? 'Resource' : 'Resources'}</Badge>
          ) : null
        }
      />

      {/* Category Filter Tabs */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategorySelect('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
              category === 'all'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategorySelect(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all border ${
                category === cat
                  ? 'bg-primary text-white border-primary shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 border-slate-200/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search and Filters Toolbar */}
      <Card className="border-slate-200/80 shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1">
            <SearchInput
              value={search}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
              placeholder="Search study materials by title, topic..."
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-full sm:w-48">
              <select
                id="resource-format-filter"
                value={type}
                onChange={handleTypeChange}
                aria-label="Filter by material format"
                className="w-full h-9 px-3 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
              >
                <option value="all">All Formats</option>
                <option value="pdf">PDF Documents</option>
                <option value="article">Articles & Guides</option>
                <option value="note">Revision Notes</option>
                <option value="video">Videos</option>
                <option value="link">External Links</option>
              </select>
            </div>

            {isFiltered && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
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
            title="Unable to load study materials."
            message={error}
            onRetry={fetchResources}
          />
        </div>
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<BookOpenIcon className="w-6 h-6 text-slate-400" />}
          title={isFiltered ? 'No matching resources found' : 'No study materials available yet'}
          description={
            isFiltered
              ? 'Try modifying your search keywords or switching category/format filters.'
              : 'Study materials curated by your placement team will appear here.'
          }
          action={
            isFiltered ? (
              <Button variant="outline" onClick={handleClearFilters}>
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
            {resources.map((r) => (
              <Card
                key={r._id}
                hoverable
                onClick={() => navigate(`/resources/${r._id}`)}
                className="group flex flex-col justify-between transition-all duration-200 hover:border-slate-300"
              >
                <CardContent className="p-5 sm:p-6 space-y-4 flex flex-col justify-between h-full">
                  <div className="space-y-3">
                    {/* Format Badge & Topic Header */}
                    <div className="flex items-center justify-between gap-2">
                      {getFormatBadge(r.type)}
                      <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider truncate max-w-[150px]">
                        {r.topic}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {r.title}
                    </h3>

                    {/* Description */}
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed min-h-[3rem]">
                      {r.description || 'Comprehensive placement preparation study guide.'}
                    </p>

                    {/* Category Tag */}
                    <div className="pt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-50 border border-slate-200/80 text-slate-600">
                        {r.category}
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/resources/${r._id}`);
                      }}
                      className="flex-1 text-xs group-hover:border-slate-400"
                    >
                      Details
                    </Button>

                    {r.url && (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1"
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          fullWidth
                          iconRight={<ExternalLinkIcon className="w-3.5 h-3.5" />}
                          className="text-xs"
                        >
                          Open
                        </Button>
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
