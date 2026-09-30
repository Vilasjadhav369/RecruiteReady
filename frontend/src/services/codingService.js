import api from './api.js';

export const getCodingProblems = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/coding/problems${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const getCodingProblem = async (id) => {
  const response = await api.get(`/coding/problems/${id}`);
  return response.data?.data?.problem;
};

export const submitCodingProblem = async (id, { language, code }) => {
  const response = await api.post(`/coding/problems/${id}/submit`, { language, code });
  return response.data;
};

export const getCodingSubmissions = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/coding/submissions${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const getCodingSubmission = async (id) => {
  const response = await api.get(`/coding/submissions/${id}`);
  return response.data?.data?.submission;
};

export default {
  getCodingProblems,
  getCodingProblem,
  submitCodingProblem,
  getCodingSubmissions,
  getCodingSubmission,
};
