import api from "./api.js";

// ─── DASHBOARD, HEALTH & ANALYTICS ──────────────────────────────────────────

export const getAdminDashboard = async () => {
  const response = await api.get("/admin/dashboard");
  return response.data?.data;
};

export const getAdminHealth = async () => {
  const response = await api.get("/admin/health");
  return response.data?.data;
};

export const getAdminAuditLogs = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/audit-logs${query ? `?${query}` : ""}`);
  return response.data?.data;
};

export const getAdminAnalytics = async () => {
  const response = await api.get("/admin/analytics");
  return response.data?.data;
};

// ─── STUDENTS ───────────────────────────────────────────────────────────────

export const getStudents = async ({
  search = "",
  status = "all",
  branch = "all",
  graduationYear = "all",
  emailVerified = "all",
  sortBy = "createdAt",
  sortOrder = "desc",
  page = 1,
  limit = 10,
} = {}) => {
  const params = new URLSearchParams();
  if (search) params.append("search", search);
  if (status && status !== "all") params.append("status", status);
  if (branch && branch !== "all") params.append("branch", branch);
  if (graduationYear && graduationYear !== "all") params.append("graduationYear", graduationYear);
  if (emailVerified && emailVerified !== "all") params.append("emailVerified", emailVerified);
  if (sortBy) params.append("sortBy", sortBy);
  if (sortOrder) params.append("sortOrder", sortOrder);
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

export const bulkUpdateStudentStatus = async (ids, isActive) => {
  const response = await api.patch("/admin/students/bulk-status", { ids, isActive });
  return response.data;
};

export const downloadStudentsCsv = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.append("search", filters.search);
  if (filters.status && filters.status !== "all") params.append("status", filters.status);
  if (filters.branch && filters.branch !== "all") params.append("branch", filters.branch);
  if (filters.graduationYear && filters.graduationYear !== "all") params.append("graduationYear", filters.graduationYear);
  if (filters.emailVerified && filters.emailVerified !== "all") params.append("emailVerified", filters.emailVerified);

  const response = await api.get(`/admin/students/export-csv?${params.toString()}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data], { type: "text/csv;charset=utf-8;" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `students_export_${Date.now()}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
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

export const bulkUpdateAptitudeStatus = async (ids, isActive) => {
  const response = await api.patch("/admin/aptitude/questions/bulk-status", { ids, isActive });
  return response.data;
};

export const deleteAptitudeQuestion = async (id) => {
  const response = await api.delete(`/admin/aptitude/questions/${id}`);
  return response.data;
};

// ─── CODING PROBLEMS ────────────────────────────────────────────────────────

export const getAdminCodingProblems = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/coding/problems${query ? `?${query}` : ""}`);
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

export const bulkUpdateCodingStatus = async (ids, isActive) => {
  const response = await api.patch("/admin/coding/problems/bulk-status", { ids, isActive });
  return response.data;
};

export const deleteCodingProblem = async (id) => {
  const response = await api.delete(`/admin/coding/problems/${id}`);
  return response.data;
};

// ─── COMPANIES ──────────────────────────────────────────────────────────────

export const getAdminCompanies = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/companies${query ? `?${query}` : ""}`);
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

export const bulkUpdateCompanyStatus = async (ids, isActive) => {
  const response = await api.patch("/admin/companies/bulk-status", { ids, isActive });
  return response.data;
};

export const deleteCompany = async (id) => {
  const response = await api.delete(`/admin/companies/${id}`);
  return response.data;
};

// ─── STUDY RESOURCES ────────────────────────────────────────────────────────

export const getAdminResources = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/resources${query ? `?${query}` : ""}`);
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

export const bulkUpdateResourceStatus = async (ids, isActive) => {
  const response = await api.patch("/admin/resources/bulk-status", { ids, isActive });
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await api.delete(`/admin/resources/${id}`);
  return response.data;
};

// ─── MOCK TESTS ─────────────────────────────────────────────────────────────

export const getAdminMockTests = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/mock-tests${query ? `?${query}` : ""}`);
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

export const bulkUpdateMockTestStatus = async (ids, isPublished) => {
  const response = await api.patch("/admin/mock-tests/bulk-status", { ids, isPublished });
  return response.data;
};

export const deleteMockTest = async (id) => {
  const response = await api.delete(`/admin/mock-tests/${id}`);
  return response.data;
};

// ─── REVIEWS MODERATION ─────────────────────────────────────────────────────

export const getAdminReviews = async (params = {}) => {
  const query = new URLSearchParams(params).toString();
  const response = await api.get(`/admin/reviews${query ? `?${query}` : ""}`);
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

export const bulkUpdateReviewStatus = async (ids, status) => {
  const response = await api.patch("/admin/reviews/bulk-moderation", { ids, status });
  return response.data;
};

export const deleteReview = async (id) => {
  const response = await api.delete(`/admin/reviews/${id}`);
  return response.data;
};

export default {
  getAdminDashboard,
  getAdminHealth,
  getAdminAuditLogs,
  getAdminAnalytics,
  getStudents,
  getStudentById,
  updateStudentStatus,
  bulkUpdateStudentStatus,
  downloadStudentsCsv,
  getAdminAptitudeQuestions,
  createAptitudeQuestion,
  getAptitudeQuestionById,
  updateAptitudeQuestion,
  updateAptitudeQuestionStatus,
  bulkUpdateAptitudeStatus,
  deleteAptitudeQuestion,
  getAdminCodingProblems,
  createCodingProblem,
  getAdminCodingProblemById,
  updateCodingProblem,
  updateCodingProblemStatus,
  bulkUpdateCodingStatus,
  deleteCodingProblem,
  getAdminCompanies,
  createCompany,
  getAdminCompanyById,
  updateCompany,
  updateCompanyStatus,
  bulkUpdateCompanyStatus,
  deleteCompany,
  getAdminResources,
  createResource,
  getAdminResourceById,
  updateResource,
  updateResourceStatus,
  bulkUpdateResourceStatus,
  deleteResource,
  getAdminMockTests,
  createMockTest,
  getAdminMockTestById,
  updateMockTest,
  updateMockTestStatus,
  bulkUpdateMockTestStatus,
  deleteMockTest,
  getAdminReviews,
  approveReview,
  rejectReview,
  bulkUpdateReviewStatus,
  deleteReview,
};
