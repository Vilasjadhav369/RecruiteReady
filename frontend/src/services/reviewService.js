import api from './api.js';

export const getReviews = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/reviews${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const submitReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

export default {
  getReviews,
  submitReview,
};
