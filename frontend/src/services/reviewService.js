import api from './api.js';

export const getReviews = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/reviews${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const getMyReview = async () => {
  const response = await api.get('/reviews/my');
  return response.data?.data?.review;
};

export const submitReview = async (reviewData) => {
  const response = await api.post('/reviews', reviewData);
  return response.data;
};

export const updateReview = async (id, reviewData) => {
  const response = await api.put(`/reviews/${id}`, reviewData);
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/reviews/${id}`);
  return response.data;
};

export default {
  getReviews,
  getMyReview,
  submitReview,
  updateReview,
  deleteReview,
};
