import api, { buildQueryString } from './api.js';

export const getCompanies = async (params = {}) => {
  const query = buildQueryString(params);
  const response = await api.get(`/companies${query}`);
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
