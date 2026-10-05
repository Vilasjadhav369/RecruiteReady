import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  MockTestIcon,
  AptitudeIcon,
  CodingIcon,
  ShieldCheckIcon,
  StarIcon,
  InfoIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from '../components/ui/Icons.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Badge } from '../components/ui/Badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card.jsx';
import notificationService from '../services/notificationService.js';

function formatFullTime(ts) {
  if (!ts) return '';
  try {
    const date = new Date(ts);
    return date.toLocaleString('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(ts);
  }
}

function getNotificationBadge(type) {
  switch (type) {
    case 'review_approved':
      return <Badge variant="success" size="sm">Review Approved</Badge>;
    case 'review_rejected':
      return <Badge variant="danger" size="sm">Review Rejected</Badge>;
    case 'mock_test_completed':
      return <Badge variant="brand" size="sm">Mock Assessment</Badge>;
    case 'aptitude_completed':
      return <Badge variant="brand" size="sm">Aptitude Practice</Badge>;
    case 'coding_accepted':
      return <Badge variant="success" size="sm">Coding Accepted</Badge>;
    case 'coding_rejected':
      return <Badge variant="warning" size="sm">Coding Evaluated</Badge>;
    case 'security_alert':
      return <Badge variant="info" size="sm">Security</Badge>;
    case 'admin_review_pending':
      return <Badge variant="warning" size="sm">Admin Action</Badge>;
    default:
      return <Badge variant="default" size="sm">Update</Badge>;
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case 'review_approved':
      return <CheckCircleIcon className="w-5 h-5 text-[#166534]" />;
    case 'review_rejected':
      return <AlertCircleIcon className="w-5 h-5 text-amber-600" />;
    case 'mock_test_completed':
      return <MockTestIcon className="w-5 h-5 text-[#166534]" />;
    case 'aptitude_completed':
      return <AptitudeIcon className="w-5 h-5 text-[#166534]" />;
    case 'coding_accepted':
      return <CodingIcon className="w-5 h-5 text-[#166534]" />;
    case 'coding_rejected':
      return <CodingIcon className="w-5 h-5 text-amber-600" />;
    case 'security_alert':
      return <ShieldCheckIcon className="w-5 h-5 text-[#166534]" />;
    case 'admin_review_pending':
      return <StarIcon className="w-5 h-5 text-amber-600" />;
    default:
      return <InfoIcon className="w-5 h-5 text-slate-500" />;
  }
}

export function NotificationsPage() {
  const [filter, setFilter] = useState('all'); // 'all' | 'unread'
  const [page, setPage] = useState(1);
  const [data, setData] = useState({
    items: [],
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1,
    unreadCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const navigate = useNavigate();

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationService.getNotifications({
        page,
        limit: 15,
        unreadOnly: filter === 'unread',
      });
      setData(res || { items: [], page: 1, limit: 15, total: 0, totalPages: 1, unreadCount: 0 });
    } catch (err) {
      setError('Unable to load notifications. Please check your network connection.');
      console.error('[NotificationsPage] Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const handleMarkAsRead = async (item, e) => {
    e?.stopPropagation();
    if (item.isRead) return;

    try {
      await notificationService.markNotificationAsRead(item._id);
      setData((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
        items: prev.items.map((n) =>
          n._id === item._id ? { ...n, isRead: true, readAt: new Date() } : n
        ),
      }));
    } catch (err) {
      console.error('[NotificationsPage] Failed to mark as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (data.unreadCount === 0 || markingAll) return;
    setMarkingAll(true);
    try {
      await notificationService.markAllAsRead();
      setData((prev) => ({
        ...prev,
        unreadCount: 0,
        items: prev.items.map((n) => ({ ...n, isRead: true, readAt: new Date() })),
      }));
      if (filter === 'unread') {
        fetchNotifications();
      }
    } catch (err) {
      console.error('[NotificationsPage] Failed to mark all as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id, e) => {
    e?.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      const target = data.items.find((n) => n._id === id);
      setData((prev) => ({
        ...prev,
        total: Math.max(0, prev.total - 1),
        unreadCount: target && !target.isRead ? Math.max(0, prev.unreadCount - 1) : prev.unreadCount,
        items: prev.items.filter((n) => n._id !== id),
      }));
    } catch (err) {
      console.error('[NotificationsPage] Failed to delete notification:', err);
    }
  };

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      await handleMarkAsRead(item);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block leading-none">
            Activity & Updates
          </span>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mt-1">
            Notifications
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Live results, moderation alerts, and security updates for your account.
          </p>
        </div>

        {/* Global Actions */}
        <div className="flex items-center gap-2">
          {data.unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markingAll}
              iconLeft={<CheckIcon className="w-4 h-4" />}
            >
              {markingAll ? 'Marking...' : 'Mark all as read'}
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={fetchNotifications}
            disabled={loading}
            aria-label="Refresh notifications"
            iconLeft={<RefreshIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => {
            setFilter('all');
            setPage(1);
          }}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'all'
              ? 'bg-[#166534] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Notifications
        </button>

        <button
          type="button"
          onClick={() => {
            setFilter('unread');
            setPage(1);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
            filter === 'unread'
              ? 'bg-[#166534] text-white shadow-2xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <span>Unread</span>
          {data.unreadCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                filter === 'unread'
                  ? 'bg-white text-[#166534]'
                  : 'bg-[#DCFCE7] text-[#14532D]'
              }`}
            >
              {data.unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Content Area */}
      {error ? (
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircleIcon className="w-8 h-8 text-red-500 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Unable to load notifications</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchNotifications}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      ) : loading && data.items.length === 0 ? (
        <Card>
          <CardContent className="p-6 space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4 animate-pulse pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                <div className="w-10 h-10 rounded-xl bg-slate-200 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                  <div className="h-2.5 bg-slate-200 rounded w-1/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : data.items.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
              <BellIcon className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800">
              {filter === 'unread' ? 'All caught up!' : 'No notifications yet'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {filter === 'unread'
                ? 'You have read all your notifications. New updates will appear here.'
                : 'Important updates regarding your test results, coding submissions, and reviews will appear here.'}
            </p>
            {filter === 'unread' && (
              <Button variant="outline" size="sm" onClick={() => setFilter('all')}>
                View All Notifications
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-slate-100 list-none m-0 p-0" role="list">
            {data.items.map((item) => (
              <li
                key={item._id}
                onClick={() => handleItemClick(item)}
                className={`p-4 sm:p-5 flex items-start gap-4 transition-colors cursor-pointer group ${
                  !item.isRead ? 'bg-[#F0FDF4]/70 hover:bg-[#F0FDF4]' : 'hover:bg-slate-50'
                }`}
              >
                {/* Type Icon */}
                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/80 shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                  {getNotificationIcon(item.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        {item.title}
                      </span>
                      {getNotificationBadge(item.type)}
                      {!item.isRead && (
                        <span
                          className="w-2 h-2 rounded-full bg-[#166534] shrink-0"
                          title="Unread"
                          aria-label="Unread notification"
                        />
                      )}
                    </div>

                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatFullTime(item.createdAt)}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
                    {item.message}
                  </p>

                  {item.link && (
                    <div className="mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#166534] group-hover:underline">
                        View details <ChevronRightIcon className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0 self-center">
                  {!item.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(item, e)}
                      title="Mark as read"
                      aria-label="Mark notification as read"
                      className="p-1.5 rounded-lg text-slate-400 hover:text-[#166534] hover:bg-white transition-colors cursor-pointer"
                    >
                      <CheckIcon className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(item._id, e)}
                    title="Delete notification"
                    aria-label="Delete notification"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-white transition-colors cursor-pointer"
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

export default NotificationsPage;
