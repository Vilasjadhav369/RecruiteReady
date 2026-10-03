import api, { buildQueryString } from './api.js';

export const getResources = async (params = {}) => {
  const query = buildQueryString(params);
  const response = await api.get(`/resources${query}`);
  return response.data?.data;
};

export const getResource = async (id) => {
  const response = await api.get(`/resources/${id}`);
  return response.data?.data?.resource;
};

export default {
  getResources,
  getResource,
};
