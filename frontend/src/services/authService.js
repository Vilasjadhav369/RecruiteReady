import api from "./api.js";

export const TOKEN_KEY = "recruiteready_token";

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Register a new student account.
 *
 * @param {Object} userData - { firstName, lastName, email, password, college, branch, graduationYear }
 * @returns {Promise<Object>} API response data
 */
export const registerUser = async (userData) => {
  const response = await api.post("/auth/register", userData);
  if (response.data?.data?.token) {
    setToken(response.data.data.token);
  }
  return response.data;
};

/**
 * Log in with existing credentials.
 *
 * @param {Object} credentials - { email, password }
 * @returns {Promise<Object>} API response data
 */
export const loginUser = async (credentials) => {
  const response = await api.post("/auth/login", credentials);
  if (response.data?.data?.token) {
    setToken(response.data.data.token);
  }
  return response.data;
};

/**
 * Fetch current authenticated user profile.
 *
 * @returns {Promise<Object>} User object
 */
export const getCurrentUser = async () => {
  const response = await api.get("/auth/me");
  return response.data?.data?.user;
};

/**
 * Update authenticated user profile fields.
 *
 * @param {Object} profileData - Allowed fields: firstName, lastName, college, branch, graduationYear, targetCompanies, preparationGoals, profilePhoto
 * @returns {Promise<Object>} Updated user object
 */
export const updateProfile = async (profileData) => {
  const response = await api.put("/auth/profile", profileData);
  return response.data?.data?.user;
};

/**
 * Log out user by clearing stored token and informing backend.
 */
export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } catch (err) {
    // Ignore server error on logout; clear local token regardless
  } finally {
    removeToken();
  }
};

export default {
  getToken,
  setToken,
  removeToken,
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  logoutUser,
};
