import Notification from '../models/Notification.js';
import User from '../models/User.js';

/**
 * Create a new notification for a specific recipient.
 * Safe & idempotent: Does not duplicate if metadata.entityId matches.
 * Wrapped in try-catch so notification failures never crash core user transactions.
 */
export const createNotification = async ({
  recipient,
  type,
  title,
  message,
  link = '',
  metadata = {},
}) => {
  try {
    if (!recipient || !type || !title || !message) {
      console.warn('[NotificationService] Missing required fields for notification');
      return null;
    }

    // Idempotency check: if an entityId exists, avoid generating duplicate notifications
    if (metadata && metadata.entityId) {
      const existing = await Notification.findOne({
        recipient,
        type,
        'metadata.entityId': metadata.entityId,
      });
      if (existing) {
        return existing;
      }
    }

    const notification = await Notification.create({
      recipient,
      type,
      title: title.trim(),
      message: message.trim(),
      link: (link || '').trim(),
      metadata,
      isRead: false,
      readAt: null,
      createdAt: new Date(),
    });

    return notification;
  } catch (error) {
    console.error('[NotificationService] Failed to create notification:', error.message);
    return null;
  }
};

/**
 * Broadcast an event notification to all platform administrators.
 */
export const createAdminNotification = async ({
  type,
  title,
  message,
  link = '',
  metadata = {},
}) => {
  try {
    const admins = await User.find({ role: 'admin' }).select('_id').lean();
    if (!admins || admins.length === 0) return [];

    const createdList = [];
    for (const admin of admins) {
      const notif = await createNotification({
        recipient: admin._id,
        type,
        title,
        message,
        link,
        metadata,
      });
      if (notif) createdList.push(notif);
    }
    return createdList;
  } catch (error) {
    console.error('[NotificationService] Failed to create admin notifications:', error.message);
    return [];
  }
};

/**
 * Retrieve paginated notifications for the authenticated user.
 */
export const getUserNotifications = async (
  userId,
  { page = 1, limit = 20, unreadOnly = false } = {}
) => {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (safePage - 1) * safeLimit;

  const filter = { recipient: userId };
  if (unreadOnly === true || unreadOnly === 'true' || unreadOnly === '1') {
    filter.isRead = false;
  }

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: userId, isRead: false }),
  ]);

  const totalPages = Math.ceil(total / safeLimit) || 1;

  return {
    items,
    page: safePage,
    limit: safeLimit,
    total,
    totalPages,
    unreadCount,
    hasNextPage: safePage < totalPages,
  };
};

/**
 * Retrieve total unread notifications count for a user.
 */
export const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};

/**
 * Mark a single notification as read if owned by the user.
 */
export const markAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { $set: { isRead: true, readAt: new Date() } },
    { returnDocument: 'after' }
  );

  return notification;
};

/**
 * Mark all unread notifications as read for the user.
 */
export const markAllAsRead = async (userId) => {
  const result = await Notification.updateMany(
    { recipient: userId, isRead: false },
    { $set: { isRead: true, readAt: new Date() } }
  );

  return { modifiedCount: result.modifiedCount };
};

/**
 * Delete a specific notification if owned by the user.
 */
export const deleteNotification = async (userId, notificationId) => {
  const deleted = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: userId,
  });

  return deleted;
};

export default {
  createNotification,
  createAdminNotification,
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};
