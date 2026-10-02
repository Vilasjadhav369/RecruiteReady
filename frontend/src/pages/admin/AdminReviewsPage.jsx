import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  getAdminReviews,
  approveReview,
  rejectReview,
} from '../../services/adminService.js';
import {
  PageHeader,
  Badge,
  StatusBadge,
  Button,
  SearchInput,
  Select,
  Modal,
  Toast,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  ErrorState,
  SkeletonTableRow,
  Avatar,
} from '../../components/ui/index.js';
import {
  StarIcon,
  CheckIcon,
  CloseIcon,
  EyeIcon,
  DocumentIcon,
  CheckCircleIcon,
  ClockIcon,
} from '../../components/ui/Icons.jsx';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_TABS = [
  { key: 'pending', label: 'Pending Moderation' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all', label: 'All Reviews' },
];

const RATING_FILTER_OPTIONS = [
  { value: '', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'object') return Number(val.total ?? val.count ?? 0) || 0;
  return Number(val) || 0;
};

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
};

const getStudentName = (user) => {
  if (!user) return 'Student';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || 'Student';
};

// ─── Rating Stars Component ───────────────────────────────────────────────────

function RatingStars({ rating = 0, size = 'sm' }) {
  const iconSize = size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5';
  const numRating = Number(rating) || 0;

  return (
    <div
      className="inline-flex items-center gap-1.5 select-none"
      aria-label={`Rating: ${numRating} out of 5 stars`}
    >
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }, (_, i) => (
          <StarIcon
            key={i}
            filled={i < numRating}
            className={`${iconSize} ${
              i < numRating ? 'text-amber-500 fill-amber-500' : 'text-slate-200'
            }`}
          />
        ))}
      </div>
      <span className="text-xs font-semibold text-slate-700">
        {numRating}/5
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminReviewsPage() {
  // ── Data State ──
  const [reviews, setReviews] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Filters ──
  const [activeTab, setActiveTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const searchTimerRef = useRef(null);

  // ── Moderation Action Confirmation Modal ──
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    action: null, // 'approve' | 'reject'
    review: null,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // ── View Detail Modal ──
  const [viewReview, setViewReview] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ── Toast State ──
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (variant, title, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ variant, title, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  // ── Debounced Search ──
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  // ── Fetch Reviews ──
  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };
      if (activeTab !== 'all') {
        params.status = activeTab;
      }

      const data = await getAdminReviews(params);
      setReviews(data?.reviews || []);
      setPagination(
        data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      );
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setError(
        err.response?.data?.message || 'Failed to load student reviews for moderation.'
      );
    } finally {
      setLoading(false);
    }
  }, [activeTab, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // ── Client-side search and rating filter over loaded page ──
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      // Rating filter
      if (ratingFilter && String(r.rating) !== String(ratingFilter)) {
        return false;
      }

      // Search query (matches student name, title, comment, or college)
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase().trim();
        const studentName = getStudentName(r.user).toLowerCase();
        const college = (r.user?.college || '').toLowerCase();
        const title = (r.title || '').toLowerCase();
        const comment = (r.comment || '').toLowerCase();

        if (
          !studentName.includes(q) &&
          !college.includes(q) &&
          !title.includes(q) &&
          !comment.includes(q)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [reviews, ratingFilter, debouncedSearch]);

  const hasActiveFilters = debouncedSearch || ratingFilter;

  const clearAllFilters = () => {
    setSearch('');
    setDebouncedSearch('');
    setRatingFilter('');
  };

  // ── Moderation Action Handlers ──
  const handleOpenConfirm = (action, review) => {
    setConfirmModal({
      isOpen: true,
      action,
      review,
    });
  };

  const handleCloseConfirm = () => {
    setConfirmModal({
      isOpen: false,
      action: null,
      review: null,
    });
  };

  const handleExecuteModeration = async () => {
    const { action, review } = confirmModal;
    if (!action || !review) return;

    try {
      setActionLoading(true);
      if (action === 'approve') {
        await approveReview(review._id);
        setReviews((prev) =>
          prev.map((r) =>
            r._id === review._id ? { ...r, status: 'approved' } : r
          )
        );
        showToast(
          'success',
          'Review Approved',
          'Review approved and published to the public feedback showcase.'
        );
      } else if (action === 'reject') {
        await rejectReview(review._id);
        setReviews((prev) =>
          prev.map((r) =>
            r._id === review._id ? { ...r, status: 'rejected' } : r
          )
        );
        showToast(
          'info',
          'Review Rejected',
          'Review marked as rejected and hidden from public display.'
        );
      }

      // If view modal was open for this review, update its status
      if (viewReview && viewReview._id === review._id) {
        setViewReview((prev) => ({
          ...prev,
          status: action === 'approve' ? 'approved' : 'rejected',
        }));
      }

      handleCloseConfirm();
    } catch (err) {
      console.error(`Failed to ${action} review:`, err);
      showToast(
        'error',
        'Action Failed',
        err.response?.data?.message || `Failed to ${action} review. Please try again.`
      );
    } finally {
      setActionLoading(false);
    }
  };

  // ── View Detail Modal ──
  const handleOpenViewModal = (review) => {
    setViewReview(review);
    setIsViewModalOpen(true);
  };

  // ── Pagination Calculation ──
  const paginationStart =
    safeNumber(pagination.total) > 0
      ? (pagination.page - 1) * pagination.limit + 1
      : 0;
  const paginationEnd = Math.min(
    pagination.page * pagination.limit,
    safeNumber(pagination.total)
  );

  // ── Contextual Empty State Messages ──
  const getEmptyStateContent = () => {
    if (hasActiveFilters) {
      return {
        title: 'No reviews match your filters',
        description: 'Try adjusting your search terms or rating filter.',
      };
    }
    if (activeTab === 'pending') {
      return {
        title: 'No reviews waiting for moderation',
        description:
          'All student feedback submissions have been processed. New reviews will appear here as they are submitted.',
      };
    }
    if (activeTab === 'approved') {
      return {
        title: 'No approved reviews yet',
        description:
          'Reviews approved by administrators will appear here and on the public student reviews page.',
      };
    }
    if (activeTab === 'rejected') {
      return {
        title: 'No rejected reviews',
        description:
          'Reviews rejected during moderation will be archived here for compliance.',
      };
    }
    return {
      title: 'No reviews submitted yet',
      description:
        'Student feedback and placement preparation ratings will appear here once submitted.',
    };
  };

  const emptyContent = getEmptyStateContent();

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] w-80 animate-in fade-in slide-in-from-top-2 duration-200">
          <Toast
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* ── Page Header ── */}
      <PageHeader
        title="Reviews"
        description="Review and moderate student feedback."
        badge={
          !loading && (
            <Badge variant="primary" size="sm">
              {safeNumber(pagination.total)} Total Reviews
            </Badge>
          )
        }
      />

      {/* ── Status Moderation Tabs ── */}
      <div className="flex flex-wrap items-center gap-1 bg-white border border-slate-200/80 rounded-xl p-1 shadow-xs w-fit">
        {STATUS_TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Search and Rating Filters Toolbar ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch('')}
              placeholder="Search by student name, college, or review text…"
            />
          </div>
          <div>
            <Select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              options={RATING_FILTER_OPTIONS}
            />
          </div>
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Filters active — showing matching reviews
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead className="min-w-[280px]">Review</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={6} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to Load Reviews"
          message={error}
          onRetry={fetchReviews}
        />
      ) : filteredReviews.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon className="w-8 h-8" />}
          title={emptyContent.title}
          description={emptyContent.description}
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear Filters
              </Button>
            ) : null
          }
        />
      ) : (
        <>
          {/* ── Desktop Moderation Table ── */}
          <div className="hidden md:block bg-white border border-slate-200/80 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[220px]">Student</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead className="min-w-[300px]">Review Feedback</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReviews.map((review) => {
                    const studentName = getStudentName(review.user);
                    const college = review.user?.college || '';
                    return (
                      <TableRow key={review._id}>
                        {/* Student Info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar name={studentName} size="md" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 leading-snug truncate">
                                {studentName}
                              </p>
                              {college && (
                                <p className="text-xs text-slate-500 truncate max-w-[180px]">
                                  {college}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Rating */}
                        <TableCell>
                          <RatingStars rating={review.rating} />
                        </TableCell>

                        {/* Review Content Preview */}
                        <TableCell>
                          <div className="max-w-md">
                            {review.title && (
                              <p className="text-xs font-semibold text-slate-800 line-clamp-1 mb-0.5">
                                {review.title}
                              </p>
                            )}
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {review.comment}
                            </p>
                          </div>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge status={review.status} />
                        </TableCell>

                        {/* Submitted Date */}
                        <TableCell>
                          <span className="text-xs text-slate-500 whitespace-nowrap">
                            {formatDate(review.createdAt)}
                          </span>
                        </TableCell>

                        {/* Moderation Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenViewModal(review)}
                              title="View full review details"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </Button>

                            {review.status !== 'approved' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenConfirm('approve', review)}
                                className="text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                                title="Approve and publish review"
                              >
                                Approve
                              </Button>
                            )}

                            {review.status !== 'rejected' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenConfirm('reject', review)}
                                className="text-rose-700 border-rose-200 hover:bg-rose-50 hover:text-rose-800"
                                title="Reject review"
                              >
                                Reject
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Row */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Showing{' '}
                <span className="font-semibold text-slate-700">
                  {paginationStart}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-slate-700">
                  {paginationEnd}
                </span>{' '}
                of{' '}
                <span className="font-semibold text-slate-700">
                  {safeNumber(pagination.total)}
                </span>{' '}
                reviews
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-600 font-medium px-2">
                  Page {pagination.page} of {pagination.pages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= (pagination.pages || 1)}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* ── Mobile Review Cards ── */}
          <div className="md:hidden space-y-3">
            {filteredReviews.map((review) => {
              const studentName = getStudentName(review.user);
              const college = review.user?.college || '';
              return (
                <div
                  key={review._id}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3"
                >
                  {/* Top: Student & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar name={studentName} size="sm" />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-snug truncate">
                          {studentName}
                        </p>
                        {college && (
                          <p className="text-xs text-slate-500 truncate">
                            {college}
                          </p>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={review.status} />
                  </div>

                  {/* Rating & Date */}
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <RatingStars rating={review.rating} />
                    <span>{formatDate(review.createdAt)}</span>
                  </div>

                  {/* Review Text */}
                  <div>
                    {review.title && (
                      <p className="text-xs font-semibold text-slate-800 mb-1">
                        {review.title}
                      </p>
                    )}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {review.comment}
                    </p>
                  </div>

                  {/* Moderation Actions */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenViewModal(review)}
                    >
                      View
                    </Button>

                    {review.status !== 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                        onClick={() => handleOpenConfirm('approve', review)}
                      >
                        Approve
                      </Button>
                    )}

                    {review.status !== 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 text-rose-700 border-rose-200 hover:bg-rose-50"
                        onClick={() => handleOpenConfirm('reject', review)}
                      >
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Mobile Pagination */}
            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages || 1}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= (pagination.pages || 1)}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Review Inspection Detail Modal ───────────────────────────────── */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewReview(null);
        }}
        title="Student Review Details"
        description="Inspect submitted student evaluation and review metadata."
        maxWidth="max-w-xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsViewModalOpen(false);
                setViewReview(null);
              }}
            >
              Close
            </Button>
            {viewReview && viewReview.status !== 'approved' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleOpenConfirm('approve', viewReview);
                }}
              >
                Approve Review
              </Button>
            )}
            {viewReview && viewReview.status !== 'rejected' && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  handleOpenConfirm('reject', viewReview);
                }}
              >
                Reject Review
              </Button>
            )}
          </>
        }
      >
        {viewReview && (
          <div className="space-y-4">
            {/* Student Info Card */}
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <div className="flex items-center gap-3">
                <Avatar name={getStudentName(viewReview.user)} size="lg" />
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 leading-snug">
                    {getStudentName(viewReview.user)}
                  </h4>
                  {viewReview.user?.college && (
                    <p className="text-xs text-slate-500 mt-0.5">
                      {viewReview.user.college}
                    </p>
                  )}
                  {viewReview.user?.email && (
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {viewReview.user.email}
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge status={viewReview.status} />
            </div>

            {/* Rating Section */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Evaluation Rating
              </span>
              <RatingStars rating={viewReview.rating} size="lg" />
            </div>

            {/* Title & Comment */}
            <div className="space-y-1.5 p-3.5 bg-white border border-slate-200 rounded-xl">
              {viewReview.title && (
                <h5 className="text-sm font-semibold text-slate-900">
                  {viewReview.title}
                </h5>
              )}
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {viewReview.comment}
              </p>
            </div>

            {/* Metadata Timestamps */}
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 pt-2 border-t border-slate-100">
              <span>Submitted: {formatDate(viewReview.createdAt)}</span>
              {viewReview.moderatedAt && (
                <span>Moderated: {formatDate(viewReview.moderatedAt)}</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Moderation Confirmation Modal ────────────────────────────────── */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={handleCloseConfirm}
        title={
          confirmModal.action === 'approve'
            ? 'Approve Student Review?'
            : 'Reject Student Review?'
        }
        description={
          confirmModal.action === 'approve'
            ? 'This review will become publicly visible to all students on the platform.'
            : 'This review will be marked as rejected and hidden from public display.'
        }
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCloseConfirm}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant={confirmModal.action === 'approve' ? 'primary' : 'danger'}
              size="sm"
              loading={actionLoading}
              onClick={handleExecuteModeration}
            >
              {confirmModal.action === 'approve'
                ? 'Approve & Publish'
                : 'Reject Review'}
            </Button>
          </>
        }
      >
        {confirmModal.review && (
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-800">
                {getStudentName(confirmModal.review.user)}
              </span>
              <RatingStars rating={confirmModal.review.rating} />
            </div>
            {confirmModal.review.title && (
              <p className="text-xs font-medium text-slate-900">
                {confirmModal.review.title}
              </p>
            )}
            <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
              "{confirmModal.review.comment}"
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
