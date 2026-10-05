import api from './api.js';

/**
 * notificationService — Client-side API binding for user notifications.
 * Strictly communicates with backend /api/notifications.
 */

export const getNotifications = async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
  const params = new URLSearchParams();
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);
  if (unreadOnly) params.append('unreadOnly', 'true');

  const response = await api.get(`/notifications?${params.toString()}`);
  return response.data?.data;
};

export const getUnreadCount = async () => {
  const response = await api.get('/notifications/unread-count');
  return response.data?.data?.unreadCount || 0;
};

export const markNotificationAsRead = async (id) => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data?.data?.notification;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch('/notifications/read-all');
  return response.data?.data;
};

export const deleteNotification = async (id) => {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
};

export default {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
