import api from './api.js';

export const getResources = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/resources${query ? `?${query}` : ''}`);
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
