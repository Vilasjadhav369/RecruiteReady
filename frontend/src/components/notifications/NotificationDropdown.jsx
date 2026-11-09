import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BellIcon,
  CheckIcon,
  TrashIcon,
  RefreshIcon,
  InfoIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  MockTestIcon,
  AptitudeIcon,
  CodingIcon,
  ResourcesIcon,
  ShieldCheckIcon,
  ChevronRightIcon,
  StarIcon,
} from '../ui/Icons.jsx';
import notificationService from '../../services/notificationService.js';
import {
  useUnreadNotificationCount,
  useInvalidateUnreadCount,
} from '../../hooks/useUnreadNotificationCount.js';

function formatRelativeTime(ts) {
  if (!ts) return '';
  try {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

function getNotificationIcon(type) {
  switch (type) {
    case 'review_approved':
      return <CheckCircleIcon className="w-4 h-4 text-success" />;
    case 'review_rejected':
      return <AlertCircleIcon className="w-4 h-4 text-danger" />;
    case 'mock_test_completed':
    case 'new_mock_test':
      return <MockTestIcon className="w-4 h-4 text-ink" />;
    case 'new_study_material':
      return <ResourcesIcon className="w-4 h-4 text-ink" />;
    case 'aptitude_completed':
      return <AptitudeIcon className="w-4 h-4 text-ink" />;
    case 'coding_accepted':
      return <CodingIcon className="w-4 h-4 text-success" />;
    case 'coding_rejected':
      return <CodingIcon className="w-4 h-4 text-warning" />;
    case 'security_alert':
      return <ShieldCheckIcon className="w-4 h-4 text-ink" />;
    case 'admin_review_pending':
      return <StarIcon className="w-4 h-4 text-warning" />;
    default:
      return <InfoIcon className="w-4 h-4 text-ink-2" />;
  }
}

export function NotificationDropdown({ align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [markingAll, setMarkingAll] = useState(false);

  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Shared TanStack Query for unread count (consolidated with StudentSidebar)
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const invalidateUnreadCount = useInvalidateUnreadCount();

  // Fetch recent notifications when dropdown opens
  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications({ page: 1, limit: 6 });
      setNotifications(data?.items || []);
    } catch (err) {
      setError('Unable to load notifications.');
      console.error('[NotificationDropdown] Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Outside click & Escape keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMarkAsRead = async (item, e) => {
    e.stopPropagation();
    if (item.isRead) return;
    try {
      await notificationService.markNotificationAsRead(item._id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
      );
      invalidateUnreadCount();
    } catch (err) {
      console.error('[NotificationDropdown] Failed to mark read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationService.markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      invalidateUnreadCount();
    } catch (err) {
      console.error('[NotificationDropdown] Failed to mark all read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationService.deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((n) => n._id === id);
        if (target && !target.isRead) {
          invalidateUnreadCount();
        }
        return prev.filter((n) => n._id !== id);
      });
    } catch (err) {
      console.error('[NotificationDropdown] Failed to delete:', err);
    }
  };

  const handleItemClick = async (item) => {
    if (!item.isRead) {
      try {
        await notificationService.markNotificationAsRead(item._id);
        setNotifications((prev) =>
          prev.map((n) => (n._id === item._id ? { ...n, isRead: true } : n))
        );
        invalidateUnreadCount();
      } catch (err) {
        console.error('[NotificationDropdown] Error reading item on click:', err);
      }
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative min-w-[36px] min-h-[36px] p-2 rounded-lg text-ink-2 hover:text-ink hover:bg-primary-soft flex items-center justify-center transition-colors cursor-pointer border border-border focus-visible:outline-2 focus-visible:outline-primary shadow-2xs"
        aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : 'Notifications'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Notifications"
      >
        <BellIcon className="w-4 h-4 text-ink-2" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-primary text-surface text-[10px] font-mono font-bold rounded-full flex items-center justify-center leading-none border-2 border-card select-none animate-in zoom-in-75">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Notification center"
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden text-xs animate-in fade-in zoom-in-95 duration-100`}
        >
          {/* Header */}
          <div className="px-4 py-3 border-b border-border flex items-center justify-between bg-primary-soft/50">
            <div className="flex items-center gap-2">
              <span className="font-bold text-ink text-sm">Notifications</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-primary-tint text-ink">
                  {unreadCount} new
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  disabled={markingAll}
                  className="text-[11px] font-semibold text-primary hover:underline cursor-pointer disabled:opacity-50"
                  aria-label="Mark all notifications as read"
                >
                  {markingAll ? 'Marking...' : 'Mark all read'}
                </button>
              )}
              <button
                type="button"
                onClick={fetchNotifications}
                disabled={loading}
                className="p-1 rounded text-ink-2 hover:text-ink hover:bg-primary-soft cursor-pointer transition-colors"
                aria-label="Refresh notifications"
                title="Refresh"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* List Content */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-border">
            {loading && notifications.length === 0 ? (
              <div className="p-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-lg bg-primary-soft shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-primary-soft rounded w-3/4" />
                      <div className="h-2.5 bg-primary-soft rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="p-6 text-center space-y-2">
                <AlertCircleIcon className="w-6 h-6 text-danger mx-auto" />
                <p className="text-danger font-medium text-xs">{error}</p>
                <button
                  type="button"
                  onClick={fetchNotifications}
                  className="px-3 py-1 bg-primary-soft hover:bg-primary-tint text-ink font-semibold rounded-lg text-[11px] transition-colors cursor-pointer border border-border"
                >
                  Retry
                </button>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-primary-soft text-ink-2 mx-auto flex items-center justify-center">
                  <BellIcon className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-ink">No notifications yet</h4>
                <p className="text-[11px] text-ink-2 max-w-[220px] mx-auto leading-relaxed">
                  Important updates, test results, and reviews will appear here.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border list-none m-0 p-0" role="list">
                {notifications.map((item) => (
                  <li
                    key={item._id}
                    onClick={() => handleItemClick(item)}
                    className={`p-3 sm:px-4 flex items-start gap-3 transition-colors cursor-pointer group ${
                      !item.isRead ? 'bg-primary-tint/50 hover:bg-primary-tint' : 'hover:bg-primary-soft'
                    }`}
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-primary-soft border border-border flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-ink block truncate text-xs">
                          {item.title}
                        </span>
                        {!item.isRead && (
                          <span
                            className="w-2 h-2 rounded-full bg-primary shrink-0"
                            title="Unread"
                            aria-label="Unread notification"
                          />
                        )}
                      </div>

                      <p className="text-[11px] text-ink-2 line-clamp-2 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-1 text-[10px] text-ink-2 font-mono">
                        <span>{formatRelativeTime(item.createdAt)}</span>
                        {item.link && (
                          <span className="text-primary font-sans font-semibold group-hover:underline flex items-center gap-0.5">
                            View <ChevronRightIcon className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      {!item.isRead && (
                        <button
                          type="button"
                          onClick={(e) => handleMarkAsRead(item, e)}
                          title="Mark as read"
                          aria-label="Mark notification as read"
                          className="p-1 rounded text-ink-2 hover:text-ink hover:bg-card cursor-pointer"
                        >
                          <CheckIcon className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => handleDelete(item._id, e)}
                        title="Delete notification"
                        aria-label="Delete notification"
                        className="p-1 rounded text-ink-2 hover:text-danger hover:bg-card cursor-pointer"
                      >
                        <TrashIcon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer: View All link */}
          <div className="px-4 py-2.5 bg-primary-soft/50 border-t border-border flex items-center justify-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1 no-underline"
            >
              View all notifications <ChevronRightIcon className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationDropdown;
