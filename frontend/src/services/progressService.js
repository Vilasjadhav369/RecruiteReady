import api from './api.js';

export const getProgressSummary = async () => {
  const response = await api.get('/progress/summary');
  return response.data?.data;
};

export default {
  getProgressSummary,
};
