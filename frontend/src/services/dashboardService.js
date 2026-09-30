import api from "./api.js";

/**
 * Fetch real dashboard summary data for the authenticated student.
 *
 * @returns {Promise<Object>} Summary data payload
 */
export const getDashboardSummary = async () => {
  const response = await api.get("/dashboard/summary");
  return response.data?.data;
};

export default {
  getDashboardSummary,
};
