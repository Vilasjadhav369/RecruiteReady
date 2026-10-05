import api from './api.js';

/**
 * searchService — Client-side API binding for global search.
 * Connects to /api/search.
 */

export const globalSearch = async (query, limit = 5) => {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return {
      query: '',
      totalResults: 0,
      companies: [],
      resources: [],
      coding: [],
      mockTests: [],
      aptitude: [],
    };
  }

  const response = await api.get(
    `/search?q=${encodeURIComponent(trimmed)}&limit=${limit}`
  );
  return response.data?.data;
};

export default {
  globalSearch,
};
