import React, { useState, useEffect, useCallback } from "react";
import {
  getAdminAptitudeQuestions,
  createAptitudeQuestion,
  updateAptitudeQuestion,
  updateAptitudeQuestionStatus,
} from "../../services/adminService.js";

const CATEGORIES = [
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Data Interpretation",
];

const INITIAL_FORM_STATE = {
  question: "",
  category: "Quantitative Aptitude",
  topic: "",
  difficulty: "medium",
  marks: 1,
  optionA: "",
  optionB: "",
  optionC: "",
  optionD: "",
  correctOption: "A",
  explanation: "",
  tags: "",
  isActive: true,
};

export default function AdminAptitudePage() {
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [successToast, setSuccessToast] = useState(null);

  // Action status loading tracker (questionId -> bool)
  const [togglingId, setTogglingId] = useState(null);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminAptitudeQuestions({
        search,
        category: categoryFilter,
        difficulty: difficultyFilter,
        status: statusFilter,
        page: pagination.page,
        limit: pagination.limit,
      });

      setQuestions(data?.questions || []);
      setPagination(
        data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      );
    } catch (err) {
      console.error("Error fetching aptitude questions:", err);
      setError(
        err.response?.data?.message || "Failed to load aptitude questions."
      );
    } finally {
      setLoading(false);
    }
  }, [
    search,
    categoryFilter,
    difficultyFilter,
    statusFilter,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const showSuccess = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q) => {
    setEditingQuestion(q);
    const optMap = {};
    (q.options || []).forEach((opt) => {
      optMap[`option${opt.key}`] = opt.text;
    });

    setFormData({
      question: q.question || "",
      category: q.category || "Quantitative Aptitude",
      topic: q.topic || "",
      difficulty: q.difficulty || "medium",
      marks: q.marks || 1,
      optionA: optMap.optionA || "",
      optionB: optMap.optionB || "",
      optionC: optMap.optionC || "",
      optionD: optMap.optionD || "",
      correctOption: q.correctOption || "A",
      explanation: q.explanation || "",
      tags: Array.isArray(q.tags) ? q.tags.join(", ") : "",
      isActive: q.isActive !== undefined ? q.isActive : true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingQuestion(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation
    if (!formData.question.trim()) {
      setFormError("Question text is required.");
      return;
    }
    if (!formData.category.trim()) {
      setFormError("Category is required.");
      return;
    }
    if (!formData.topic.trim()) {
      setFormError("Topic is required.");
      return;
    }
    if (
      !formData.optionA.trim() ||
      !formData.optionB.trim() ||
      !formData.optionC.trim() ||
      !formData.optionD.trim()
    ) {
      setFormError("All 4 options (A, B, C, D) are required.");
      return;
    }
    if (!formData.explanation.trim()) {
      setFormError("Explanation is required.");
      return;
    }

    const payload = {
      question: formData.question.trim(),
      category: formData.category.trim(),
      topic: formData.topic.trim(),
      difficulty: formData.difficulty,
      marks: Number(formData.marks) || 1,
      options: [
        { key: "A", text: formData.optionA.trim() },
        { key: "B", text: formData.optionB.trim() },
        { key: "C", text: formData.optionC.trim() },
        { key: "D", text: formData.optionD.trim() },
      ],
      correctOption: formData.correctOption,
      explanation: formData.explanation.trim(),
      tags: formData.tags
        ? formData.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean)
        : [],
      isActive: formData.isActive,
    };

    try {
      setFormSubmitting(true);
      if (editingQuestion) {
        await updateAptitudeQuestion(editingQuestion._id, payload);
        showSuccess("Question updated successfully.");
      } else {
        await createAptitudeQuestion(payload);
        showSuccess("New question added to bank.");
      }
      handleCloseModal();
      fetchQuestions();
    } catch (err) {
      console.error("Error saving question:", err);
      setFormError(
        err.response?.data?.message || "Failed to save question. Please check fields."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleToggleStatus = async (q) => {
    try {
      setTogglingId(q._id);
      const newStatus = !q.isActive;
      await updateAptitudeQuestionStatus(q._id, newStatus);
      setQuestions((prev) =>
        prev.map((item) =>
          item._id === q._id ? { ...item, isActive: newStatus } : item
        )
      );
      showSuccess(
        `Question marked as ${newStatus ? "Active" : "Inactive"}.`
      );
    } catch (err) {
      console.error("Failed to toggle question status:", err);
      showSuccess("Failed to update status. Please try again.");
    } finally {
      setTogglingId(null);
    }
  };

  const getDifficultyBadge = (difficulty) => {
    switch (difficulty) {
      case "easy":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
            Easy
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200/80">
            Medium
          </span>
        );
      case "hard":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
            Hard
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            {difficulty}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {successToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-3 px-4 py-3 bg-emerald-900 text-white rounded-xl shadow-xl border border-emerald-700 animate-in fade-in slide-in-from-top-4">
          <svg className="w-5 h-5 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-sm font-medium">{successToast}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              Module Bank
            </span>
            <span className="text-xs text-slate-600 font-medium">
              {pagination.total} Total Questions
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Aptitude Question Bank
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Author, categorize, and configure aptitude practice questions for upcoming student modules.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-xl shadow-xs transition-colors shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Question
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <svg
              className="w-4 h-4 text-slate-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              placeholder="Search question, topic, tags..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <select
              value={difficultyFilter}
              onChange={(e) => {
                setDifficultyFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            >
              <option value="">All Difficulties</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPagination((p) => ({ ...p, page: 1 }));
              }}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table Content */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-3 border-slate-300 border-t-slate-900 rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-600">Loading aptitude question bank...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-slate-900">{error}</p>
            <button
              onClick={fetchQuestions}
              className="mt-3 text-xs font-semibold text-slate-700 hover:text-slate-900 underline"
            >
              Try again
            </button>
          </div>
        ) : questions.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-50/60 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-slate-900">No aptitude questions found</h3>
            <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
              {search || categoryFilter || difficultyFilter || statusFilter !== "all"
                ? "No questions match your filter criteria. Try resetting the filters or add a new question."
                : "No questions currently exist in the database. Add the first question using the button below."}
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add First Question
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/60 text-[11px] font-semibold tracking-wider text-slate-600 uppercase">
                  <th className="py-3.5 px-6">Question & Details</th>
                  <th className="py-3.5 px-4">Category / Topic</th>
                  <th className="py-3.5 px-4">Difficulty</th>
                  <th className="py-3.5 px-4">Correct Answer</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {questions.map((q) => {
                  const correctOptObj = (q.options || []).find((o) => o.key === q.correctOption);
                  return (
                    <tr key={q._id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Question */}
                      <td className="py-4 px-6 max-w-md">
                        <div className="font-medium text-slate-900 line-clamp-2">
                          {q.question}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          {q.tags && q.tags.map((t, idx) => (
                            <span
                              key={idx}
                              className="inline-block px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-md"
                            >
                              #{t}
                            </span>
                          ))}
                          <span className="text-[11px] text-slate-600">
                            • {q.marks || 1} mark{q.marks > 1 ? "s" : ""}
                          </span>
                        </div>
                      </td>

                      {/* Category / Topic */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-medium text-slate-900 text-xs">{q.category}</div>
                        <div className="text-xs text-slate-600">{q.topic}</div>
                      </td>

                      {/* Difficulty */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {getDifficultyBadge(q.difficulty)}
                      </td>

                      {/* Correct Answer */}
                      <td className="py-4 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold shrink-0">
                            {q.correctOption}
                          </span>
                          <span className="text-xs text-slate-700 truncate font-mono">
                            {correctOptObj ? correctOptObj.text : "N/A"}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        {q.isActive ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(q)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                          >
                            Edit
                          </button>

                          {/* Status Toggle Button */}
                          <button
                            type="button"
                            disabled={togglingId === q._id}
                            onClick={() => handleToggleStatus(q)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition ${
                              q.isActive
                                ? "text-amber-700 hover:bg-amber-50"
                                : "text-emerald-700 hover:bg-emerald-50"
                            } ${togglingId === q._id ? "opacity-50 cursor-wait" : ""}`}
                          >
                            {togglingId === q._id
                              ? "Updating..."
                              : q.isActive
                              ? "Deactivate"
                              : "Activate"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && questions.length > 0 && (
          <div className="py-3.5 px-6 border-t border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-slate-900">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-semibold text-slate-900">{pagination.total}</span> questions
            </div>
            <div className="flex items-center gap-1.5">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Previous
              </button>
              <span className="px-2 text-slate-600 font-semibold">
                Page {pagination.page} of {pagination.pages || 1}
              </span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-3 py-1.5 border border-slate-200 rounded-lg text-slate-700 font-medium hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Question Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {editingQuestion ? "Edit Aptitude Question" : "Create New Aptitude Question"}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Configure question text, multiple choice options, explanation, and metadata.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-slate-600 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                  {formError}
                </div>
              )}

              {/* Question Text */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Question Text <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  placeholder="e.g. If 20% of A is equal to 30% of B, what is the ratio of A to B?"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
              </div>

              {/* Category, Topic, Difficulty Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Topic <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.topic}
                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                    placeholder="e.g. Ratios & Proportions"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Difficulty
                  </label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* 4 Multiple Choice Options */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-700">
                    Four Answer Options <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-slate-600">Select which option is correct</span>
                </div>

                {["A", "B", "C", "D"].map((key) => {
                  const fieldName = `option${key}`;
                  const isChecked = formData.correctOption === key;
                  return (
                    <div
                      key={key}
                      className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${
                        isChecked
                          ? "border-emerald-300 bg-emerald-50/40"
                          : "border-slate-200 bg-slate-50/60"
                      }`}
                    >
                      <input
                        type="radio"
                        id={`radio-opt-${key}`}
                        name="correctOption"
                        checked={isChecked}
                        onChange={() => setFormData({ ...formData, correctOption: key })}
                        className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                      />
                      <label
                        htmlFor={`radio-opt-${key}`}
                        className="text-xs font-bold text-slate-700 w-5 text-center cursor-pointer"
                      >
                        {key}
                      </label>
                      <input
                        type="text"
                        required
                        value={formData[fieldName]}
                        onChange={(e) =>
                          setFormData({ ...formData, [fieldName]: e.target.value })
                        }
                        placeholder={`Option ${key} text`}
                        className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-400"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Detailed Explanation / Solution <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  value={formData.explanation}
                  onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                  placeholder="Explain step-by-step how the correct answer is derived..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition"
                />
              </div>

              {/* Tags & Active Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tags (Comma separated)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. tcs, infosys, formulas"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="w-4 h-4 rounded text-slate-900 focus:ring-slate-500 border-slate-300"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Active (Visible to questions engine)
                    </span>
                  </label>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50 transition"
                >
                  {formSubmitting && (
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  )}
                  {editingQuestion ? "Update Question" : "Create Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
