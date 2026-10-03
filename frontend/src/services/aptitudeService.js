import api, { buildQueryString } from './api.js';

export const getAptitudeMetadata = async () => {
  const response = await api.get('/aptitude/metadata');
  return response.data?.data;
};

export const startAptitudeSession = async (config) => {
  const response = await api.post('/aptitude/sessions', config);
  return response.data?.data;
};

export const getAptitudeSession = async (sessionId) => {
  const response = await api.get(`/aptitude/sessions/${sessionId}`);
  return response.data?.data;
};

export const saveAptitudeAnswer = async (sessionId, { questionId, selectedOption }) => {
  const response = await api.patch(`/aptitude/sessions/${sessionId}/answers`, {
    questionId,
    selectedOption,
  });
  return response.data?.data;
};

export const submitAptitudeSession = async (sessionId) => {
  const response = await api.post(`/aptitude/sessions/${sessionId}/submit`);
  return response.data?.data;
};

export const getAptitudeResult = async (sessionId) => {
  const response = await api.get(`/aptitude/results/${sessionId}`);
  return response.data?.data;
};

export const getAptitudeHistory = async (params = {}) => {
  const query = buildQueryString(params);
  const response = await api.get(`/aptitude/history${query}`);
  return response.data?.data;
};

export default {
  getAptitudeMetadata,
  startAptitudeSession,
  getAptitudeSession,
  saveAptitudeAnswer,
  submitAptitudeSession,
  getAptitudeResult,
  getAptitudeHistory,
};
