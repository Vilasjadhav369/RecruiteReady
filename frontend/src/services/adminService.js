import api from "./api.js";

// ─── DASHBOARD & ANALYTICS ──────────────────────────────────────────────────

export const getAdminDashboard = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data?.data;
};

export const getAdminAnalytics = async () => {
  const response = await api.get("/admin/analytics");
  return response.data?.data;
};

// ─── STUDENTS ───────────────────────────────────────────────────────────────

export const getStudents = async ({ search = "", status = "all", page = 1, limit = 10 } = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await api.get(`/admin/students?${params.toString()}`);
  return response.data?.data;
};

export const getStudentById = async (id) => {
  const response = await api.get(`/admin/students/${id}`);
  return response.data?.data?.student;
};

export const updateStudentStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/students/${id}/status`, { isActive });
  return response.data?.data?.student;
};

// ─── APTITUDE QUESTIONS ─────────────────────────────────────────────────────

export const getAdminAptitudeQuestions = async ({
  search = "",
  category = "",
  difficulty = "",
  status = "all",
  page = 1,
  limit = 10,
} = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (category) params.append("category", category);
  if (difficulty) params.append("difficulty", difficulty);
  if (status && status !== "all") params.append("status", status);
  if (page) params.append("page", page);
  if (limit) params.append("limit", limit);

  const response = await api.get(`/admin/aptitude/questions?${params.toString()}`);
  return response.data?.data;
};

export const createAptitudeQuestion = async (questionData) => {
  const response = await api.post("/admin/aptitude/questions", questionData);
  return response.data?.data?.question;
};

export const getAptitudeQuestionById = async (id) => {
  const response = await api.get(`/admin/aptitude/questions/${id}`);
  return response.data?.data?.question;
};

export const updateAptitudeQuestion = async (id, questionData) => {
  const response = await api.put(`/admin/aptitude/questions/${id}`, questionData);
  return response.data?.data?.question;
};

export const updateAptitudeQuestionStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/aptitude/questions/${id}/status`, { isActive });
  return response.data?.data?.question;
};

// ─── CODING PROBLEMS ────────────────────────────────────────────────────────

export const getAdminCodingProblems = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/coding/problems${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const createCodingProblem = async (data) => {
  const response = await api.post("/admin/coding/problems", data);
  return response.data?.data?.problem;
};

export const getAdminCodingProblemById = async (id) => {
  const response = await api.get(`/admin/coding/problems/${id}`);
  return response.data?.data?.problem;
};

export const updateCodingProblem = async (id, data) => {
  const response = await api.put(`/admin/coding/problems/${id}`, data);
  return response.data?.data?.problem;
};

export const updateCodingProblemStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/coding/problems/${id}/status`, { isActive });
  return response.data?.data?.problem;
};

// ─── COMPANIES ──────────────────────────────────────────────────────────────

export const getAdminCompanies = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/companies${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const createCompany = async (data) => {
  const response = await api.post("/admin/companies", data);
  return response.data?.data?.company;
};

export const getAdminCompanyById = async (id) => {
  const response = await api.get(`/admin/companies/${id}`);
  return response.data?.data?.company;
};

export const updateCompany = async (id, data) => {
  const response = await api.put(`/admin/companies/${id}`, data);
  return response.data?.data?.company;
};

export const updateCompanyStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/companies/${id}/status`, { isActive });
  return response.data?.data?.company;
};

// ─── STUDY RESOURCES ────────────────────────────────────────────────────────

export const getAdminResources = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/resources${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const createResource = async (data) => {
  const response = await api.post("/admin/resources", data);
  return response.data?.data?.resource;
};

export const getAdminResourceById = async (id) => {
  const response = await api.get(`/admin/resources/${id}`);
  return response.data?.data?.resource;
};

export const updateResource = async (id, data) => {
  const response = await api.put(`/admin/resources/${id}`, data);
  return response.data?.data?.resource;
};

export const updateResourceStatus = async (id, isActive) => {
  const response = await api.patch(`/admin/resources/${id}/status`, { isActive });
  return response.data?.data?.resource;
};

// ─── MOCK TESTS ─────────────────────────────────────────────────────────────

export const getAdminMockTests = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/mock-tests${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const createMockTest = async (data) => {
  const response = await api.post("/admin/mock-tests", data);
  return response.data?.data?.mockTest;
};

export const getAdminMockTestById = async (id) => {
  const response = await api.get(`/admin/mock-tests/${id}`);
  return response.data?.data?.mockTest;
};

export const updateMockTest = async (id, data) => {
  const response = await api.put(`/admin/mock-tests/${id}`, data);
  return response.data?.data?.mockTest;
};

export const updateMockTestStatus = async (id, isPublished) => {
  const response = await api.patch(`/admin/mock-tests/${id}/status`, { isPublished });
  return response.data?.data?.mockTest;
};

// ─── REVIEWS MODERATION ─────────────────────────────────────────────────────

export const getAdminReviews = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/reviews${query ? `?${query}` : ''}`);
  return response.data?.data;
};

export const approveReview = async (id) => {
  const response = await api.patch(`/admin/reviews/${id}/approve`);
  return response.data?.data?.review;
};

export const rejectReview = async (id) => {
  const response = await api.patch(`/admin/reviews/${id}/reject`);
  return response.data?.data?.review;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};

export default {
  getAdminDashboard,
  getAdminAnalytics,
  getStudents,
  getStudentById,
  updateStudentStatus,
  getAdminAptitudeQuestions,
  createAptitudeQuestion,
  getAptitudeQuestionById,
  updateAptitudeQuestion,
  updateAptitudeQuestionStatus,
  getAdminCodingProblems,
  createCodingProblem,
  getAdminCodingProblemById,
  updateCodingProblem,
  updateCodingProblemStatus,
  getAdminCompanies,
  createCompany,
  getAdminCompanyById,
  updateCompany,
  updateCompanyStatus,
  getAdminResources,
  createResource,
  getAdminResourceById,
  updateResource,
  updateResourceStatus,
  getAdminMockTests,
  createMockTest,
  getAdminMockTestById,
  updateMockTest,
  updateMockTestStatus,
  getAdminReviews,
  approveReview,
  rejectReview,
  deleteReview,
};
