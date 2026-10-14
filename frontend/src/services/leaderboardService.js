import api, { buildQueryString } from './api.js';

export const getLeaderboard = async (params = {}) => {
  const query = buildQueryString(params);
  const response = await api.get(`/leaderboard${query}`);
  return response.data?.data;
};

export default {
  getLeaderboard,
};
