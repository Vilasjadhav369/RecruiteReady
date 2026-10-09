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

export const getCompanyPreparation = async (id) => {
  const response = await api.get(`/companies/${id}/preparation`);
  return response.data?.data;
};

export const getCompanyProgress = async (id) => {
  const response = await api.get(`/companies/${id}/progress`);
  return response.data?.data;
};

export const updateCompanyProgress = async (id, payload) => {
  const response = await api.patch(`/companies/${id}/progress`, payload);
  return response.data?.data;
};

export const checkCompanyEligibility = async (id, data = {}) => {
  const response = await api.post(`/companies/${id}/check-eligibility`, data);
  return response.data?.data;
};

export const toggleTargetCompany = async (id) => {
  const response = await api.post(`/companies/${id}/target`);
  return response.data?.data;
};

export default {
  getCompanies,
  getCompany,
  getCompanyPreparation,
  getCompanyProgress,
  updateCompanyProgress,
  checkCompanyEligibility,
  toggleTargetCompany,
};
