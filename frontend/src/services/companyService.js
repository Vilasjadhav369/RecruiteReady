import api from './api.js';

export const getCompanies = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/companies${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const getCompany = async (id) => {
  const response = await api.get(`/companies/${id}`);
  return response.data?.data?.company;
};

export default {
  getCompanies,
  getCompany,
};
