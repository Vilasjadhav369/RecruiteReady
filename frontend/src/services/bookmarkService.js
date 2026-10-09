import api from './api.js';

/**
 * bookmarkService — Client-side API binding for bookmarks / saved items.
 * Connects to /api/bookmarks.
 */

export const getBookmarks = async ({ itemType, page = 1, limit = 20 } = {}) => {
  const params = new URLSearchParams();
  if (itemType && itemType !== 'all') params.append('itemType', itemType);
  if (page) params.append('page', page);
  if (limit) params.append('limit', limit);

  const response = await api.get(`/bookmarks?${params.toString()}`);
  return response.data?.data;
};

export const getBookmarkStatus = async (itemType, itemId) => {
  if (!itemType || !itemId) return { isBookmarked: false };
  const response = await api.get(`/bookmarks/status/${itemType}/${itemId}`);
  return response.data?.isBookmarked || false;
};

export const toggleBookmark = async (itemType, itemId) => {
  const response = await api.post('/bookmarks', { itemType, itemId });
  return response.data;
};

export const removeBookmark = async (itemType, itemId) => {
  const response = await api.delete(`/bookmarks/${itemType}/${itemId}`);
  return response.data;
};

export default {
  getBookmarks,
  getBookmarkStatus,
  toggleBookmark,
  removeBookmark,
};
