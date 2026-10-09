import express from 'express';
import {
  toggleBookmark,
  removeBookmark,
  getBookmarkStatus,
  getBookmarks,
} from '../controllers/bookmarkController.js';
import protect from '../middleware/auth.js';

const router = express.Router();

// All bookmark actions require authentication
router.use(protect);

// List bookmarks & category counts
router.get('/', getBookmarks);

// Check single item bookmark status
router.get('/status/:itemType/:itemId', getBookmarkStatus);

// Toggle bookmark (add if not exists, remove if exists)
router.post('/', toggleBookmark);

// Remove specific bookmark
router.delete('/:itemType/:itemId', removeBookmark);

export default router;
