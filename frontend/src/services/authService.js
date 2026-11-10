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
 * Sign in or register with Google credential ID token.
 *
 * @param {string} credential - Google Identity Services JWT credential
 * @returns {Promise<Object>} API response data
 */
export const googleLoginUser = async (credential) => {
  const response = await api.post("/auth/google", { credential });
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
  const data = response.data?.data;
  if (!data?.user) return data;
  // Attach goalSyncPending directly onto user object for consumer convenience
  data.user.goalSyncPending = Boolean(data.goalSyncPending);
  return data.user;
};

/**
 * Change authenticated user password.
 *
 * @param {Object} passwordData - { currentPassword, newPassword, confirmPassword }
 * @returns {Promise<Object>} API response payload
 */
export const changePassword = async (passwordData) => {
  const response = await api.patch("/auth/change-password", passwordData);
  return response.data;
};

/**
 * Request a password reset link for the given email address.
 *
 * @param {string} email
 * @returns {Promise<Object>} API response payload
 */
export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", { email });
  return response.data;
};

/**
 * Reset password using one-time token and new password.
 *
 * @param {Object} data - { token, password }
 * @returns {Promise<Object>} API response payload
 */
export const resetPassword = async ({ token, password }) => {
  const response = await api.post("/auth/reset-password", { token, password });
  return response.data;
};

/**
 * Verify account email address using verification token.
 *
 * @param {string} token
 * @returns {Promise<Object>} API response payload
 */
export const verifyEmail = async (token) => {
  const response = await api.post("/auth/verify-email", { token });
  return response.data;
};

/**
 * Resend email verification link.
 *
 * @param {string} email
 * @returns {Promise<Object>} API response payload
 */
export const resendVerification = async (email) => {
  const response = await api.post("/auth/resend-verification", { email });
  return response.data;
};

/**
 * Log out user by clearing stored token and informing backend.
 */
export const logoutUser = async () => {
  try {
    await api.post("/auth/logout");
  } catch  {
    // Ignore server error on logout; clear local token regardless
  } finally {
    removeToken();
  }
};

/**
 * Fetch all active sessions for current user.
 *
 * @returns {Promise<Array>} List of session objects
 */
export const getSessions = async () => {
  const response = await api.get("/auth/sessions");
  return response.data?.data?.sessions || [];
};

/**
 * Revoke a specific session by ID.
 *
 * @param {string} sessionId
 * @returns {Promise<Object>} API response payload
 */
export const revokeSession = async (sessionId) => {
  const response = await api.delete(`/auth/sessions/${sessionId}`);
  return response.data;
};

/**
 * Submit onboarding questionnaire and mark onboarding completed.
 *
 * @param {Object} onboardingData - { firstName, lastName, profilePhoto, college, branch, graduationYear, preparationLevel, targetCompanies, preparationGoals, skipped }
 * @returns {Promise<Object>} Updated user object
 */
export const submitOnboarding = async (onboardingData) => {
  const response = await api.put("/auth/onboarding", onboardingData);
  return response.data?.data?.user;
};

/**
 * Log out all other active sessions for current user.
 *
 * @returns {Promise<Object>} API response payload
 */
export const logoutAllSessions = async () => {
  const response = await api.post("/auth/logout-all");
  return response.data;
};

/**
 * Record user consent for terms and privacy policy (e.g. one-time OAuth consent).
 */
export const recordUserConsent = async () => {
  const response = await api.post("/auth/consent", { consent: true });
  return response.data;
};

export default {
  getToken,
  setToken,
  removeToken,
  registerUser,
  loginUser,
  googleLoginUser,
  getCurrentUser,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  logoutUser,
  getSessions,
  revokeSession,
  submitOnboarding,
  logoutAllSessions,
  recordUserConsent,
};

