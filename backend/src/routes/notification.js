import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All notification operations require authentication
router.use(protect);

// Retrieve notifications & unread count
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);

// Read state updates
router.patch('/read-all', markAllNotificationsAsRead);
router.patch('/:id/read', markNotificationAsRead);

// Deletion
router.delete('/:id', deleteNotification);

export default router;
