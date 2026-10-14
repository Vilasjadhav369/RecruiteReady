import api from "./api.js";

/**
 * Fetch authenticated student's active preparation goals with authoritative
 * calculated live progress, status notes, and self-reported completion states.
 * IDEMPOTENT: Strictly read-only, never mutates documents on read.
 *
 * @returns {Promise<{ goals: Array, summary: Object, catalog: Array }>}
 */
export const getGoals = async () => {
  const response = await api.get("/goals");
  return response.data?.data || { goals: [], summary: {}, catalog: [] };
};

/**
 * Create a new preparation goal or reactivate a soft-deleted one.
 * Client sends text and optional templateKey. Server authoritatively validates
 * catalog match, metricType, and targets.
 *
 * @param {Object} payload - { text: string, templateKey?: string }
 * @returns {Promise<{ goal: Object }>}
 */
export const createGoal = async (payload) => {
  const response = await api.post("/goals", payload);
  return response.data?.data;
};

/**
 * Edit permitted goal fields (text).
 * Server automatically re-evaluates catalog match; downgrades metric if text is custom.
 *
 * @param {string} goalId - MongoDB ObjectId string
 * @param {Object} payload - { text: string }
 * @returns {Promise<{ goal: Object }>}
 */
export const updateGoal = async (goalId, payload) => {
  const response = await api.patch(`/goals/${goalId}`, payload);
  return response.data?.data;
};

/**
 * Explicitly update self-reported completion state (complete or reopen).
 * Strictly requires boolean `completed: true | false` for idempotence.
 *
 * @param {string} goalId - MongoDB ObjectId string
 * @param {boolean} completed - Explicit boolean (true: mark complete, false: reopen)
 * @returns {Promise<{ goal: Object }>}
 */
export const toggleGoal = async (goalId, completed) => {
  const response = await api.patch(`/goals/${goalId}/toggle`, { completed });
  return response.data?.data;
};

/**
 * Soft-delete a goal (isActive: false) and synchronizes User.preparationGoals string array.
 *
 * @param {string} goalId - MongoDB ObjectId string
 * @returns {Promise<{ deletedId: string }>}
 */
export const deleteGoal = async (goalId) => {
  const response = await api.delete(`/goals/${goalId}`);
  return response.data?.data;
};

/**
 * Controlled write-path recovery endpoint to reconcile PreparationGoal documents
 * with User.preparationGoals string array if any discrepancy occurred.
 * Safe, idempotent, and retryable.
 *
 * @returns {Promise<{ goals: Array, summary: Object }>}
 */
export const syncGoals = async () => {
  const response = await api.post("/goals/sync");
  return response.data?.data;
};

export default {
  getGoals,
  createGoal,
  updateGoal,
  toggleGoal,
  deleteGoal,
  syncGoals,
};
