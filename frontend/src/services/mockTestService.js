import api from './api.js';

export const getMockTests = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/mock-tests${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const getMockTest = async (id) => {
  const response = await api.get(`/mock-tests/${id}`);
  return response.data?.data?.test;
};

export const startMockTest = async (id) => {
  const response = await api.post(`/mock-tests/${id}/start`);
  return response.data?.data;
};

export const getMockAttempt = async (attemptId) => {
  const response = await api.get(`/mock-tests/attempts/${attemptId}`);
  return response.data?.data;
};

export const saveMockAnswer = async (attemptId, { questionId, selectedOption, codeSubmissionId }) => {
  const response = await api.patch(`/mock-tests/attempts/${attemptId}/answers`, {
    questionId,
    selectedOption,
    codeSubmissionId,
  });
  return response.data?.data;
};

export const submitMockTest = async (attemptId) => {
  const response = await api.post(`/mock-tests/attempts/${attemptId}/submit`);
  return response.data?.data;
};

export const getMockResult = async (attemptId) => {
  const response = await api.get(`/mock-tests/attempts/${attemptId}/result`);
  return response.data?.data;
};

export const getMockHistory = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/mock-tests/history${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export default {
  getMockTests,
  getMockTest,
  startMockTest,
  getMockAttempt,
  saveMockAnswer,
  submitMockTest,
  getMockResult,
  getMockHistory,
};
