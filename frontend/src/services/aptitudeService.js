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

export const saveAptitudeAnswer = async (sessionId, { questionId, selectedOption, version, clientTimestamp }) => {
  const response = await api.patch(`/aptitude/sessions/${sessionId}/answers`, {
    questionId,
    selectedOption,
    version,
    clientTimestamp,
  });
  return response.data?.data;
};

export const sendAptitudeTelemetry = async (sessionId, { eventType, metadata }) => {
  try {
    const response = await api.post(`/aptitude/sessions/${sessionId}/telemetry`, {
      eventType,
      metadata,
    });
    return response.data?.data;
  } catch (err) {
    // Non-punitive telemetry dispatch failure shouldn't disrupt student session
    return null;
  }
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
  sendAptitudeTelemetry,
  submitAptitudeSession,
  getAptitudeResult,
  getAptitudeHistory,
};
