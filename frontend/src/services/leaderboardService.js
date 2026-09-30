import api from './api.js';

export const getLeaderboard = async () => {
  const response = await api.get('/leaderboard');
  return response.data?.data;
};

export default {
  getLeaderboard,
};
