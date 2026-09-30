import React, { useState, useEffect, useCallback } from 'react';
import { getAdminReviews, approveReview, rejectReview } from '../../services/adminService.js';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'pending', label: 'Pending' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [actionId, setActionId] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {};
      if (activeTab !== 'all') params.status = activeTab;

      const data = await getAdminReviews(params);
      setReviews(data?.reviews || []);
    } catch (err) {
      console.error('Fetch reviews error:', err);
      setError('Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleApprove = async (id) => {
    try {
      setActionId(id);
      await approveReview(id);
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: 'approved' } : r))
      );
      showSuccess('Review approved and published.');
    } catch (err) {
      console.error('Approve error:', err);
      alert('Failed to approve review.');
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id) => {
    try {
      setActionId(id);
      await rejectReview(id);
      setReviews((prev) =>
        prev.map((r) => (r._id === id ? { ...r, status: 'rejected' } : r))
      );
      showSuccess('Review rejected.');
    } catch (err) {
      console.error('Reject error:', err);
      alert('Failed to reject review.');
    } finally {
      setActionId(null);
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={i < rating ? 'text-amber-400' : 'text-slate-200'}
      >
        ★
      </span>
    ));
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-amber-100 text-amber-800',
      approved: 'bg-emerald-100 text-emerald-800',
      rejected: 'bg-rose-100 text-rose-800',
    };
    return (
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${
          styles[status] || 'bg-slate-100 text-slate-600'
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 text-sm">
          <span>✓</span>
          <span>{successToast}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reviews Moderation</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review, approve, or reject student-submitted platform feedback before it appears publicly.
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-sm w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition ${
              activeTab === tab.key
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading reviews...</div>
        ) : error ? (
          <div className="p-6 text-center text-rose-600 bg-rose-50 text-sm">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No {activeTab !== 'all' ? activeTab : ''} reviews found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {reviews.map((review) => (
              <div key={review._id} className="p-5 hover:bg-slate-50/50 transition">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0">
                        {review.user?.firstName?.[0]?.toUpperCase() || 'S'}
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-900">
                          {review.user?.firstName || 'Student'}{' '}
                          {review.user?.lastName || ''}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          {review.createdAt
                            ? new Date(review.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : ''}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-sm">{renderStars(review.rating)}</span>
                      {getStatusBadge(review.status)}
                    </div>

                    {review.title && (
                      <h4 className="text-sm font-semibold text-slate-800 mb-1">{review.title}</h4>
                    )}
                    <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                  </div>

                  {/* Actions for pending reviews */}
                  {review.status === 'pending' && (
                    <div className="flex gap-2 shrink-0 self-start">
                      <button
                        onClick={() => handleApprove(review._id)}
                        disabled={actionId === review._id}
                        className="px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50"
                      >
                        {actionId === review._id ? '...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(review._id)}
                        disabled={actionId === review._id}
                        className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition disabled:opacity-50"
                      >
                        {actionId === review._id ? '...' : 'Reject'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
