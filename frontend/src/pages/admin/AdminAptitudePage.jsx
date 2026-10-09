import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getAdminAptitudeQuestions,
  createAptitudeQuestion,
  updateAptitudeQuestion,
  updateAptitudeQuestionStatus,
  deleteAptitudeQuestion,
} from "../../services/adminService.js";
import {
  PageHeader,
  Badge,
  Button,
  SearchInput,
  Select,
  Input,
  Textarea,
  Modal,
  Toast,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState,
  ErrorState,
  SkeletonTableRow,
  StatusBadge,
} from "../../components/ui/index.js";
import {
  PlusIcon,
  EditIcon,
  EyeIcon,
  DocumentIcon,
  CheckCircleIcon,
  TrashIcon,
} from "../../components/ui/Icons.jsx";

// ─── Constants ────────────────────────────────────────────────────────
const CATEGORIES = [
  "Quantitative Aptitude",
  "Logical Reasoning",
  "Verbal Ability",
  "Data Interpretation",
];

const CATEGORY_OPTIONS = [
  { value: "", label: "All Categories" },
  ...CATEGORIES.map((c) => ({ value: c, label: c })),
];

const DIFFICULTY_OPTIONS = [
  { value: "", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
];

const FORM_CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

const FORM_DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
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
  correctOption: "",
  explanation: "",
  tags: "",
  isActive: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────
const safeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "object") return Number(val.total ?? val.count ?? 0) || 0;
  return Number(val) || 0;
};

const getDifficultyVariant = (d) => {
  if (d === "easy") return "success";
  if (d === "medium") return "warning";
  if (d === "hard") return "danger";
  return "default";
};

const capitalize = (s) =>
  typeof s === "string" ? s.charAt(0).toUpperCase() + s.slice(1) : "—";

const truncateText = (text, maxLen = 80) => {
  if (!text) return "—";
  return text.length > maxLen ? text.slice(0, maxLen) + "…" : text;
};

// ─── Component ────────────────────────────────────────────────────────
export default function AdminAptitudePage() {
  // ── Data State ──
  const [questions, setQuestions] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    pages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Filters ──
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const searchTimerRef = useRef(null);

  // ── Create / Edit Modal ──
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── View Detail Modal ──
  const [viewQuestion, setViewQuestion] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // ── Status Toggle Confirmation ──
  const [toggleTarget, setToggleTarget] = useState(null);
  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  // ── Delete Confirmation ──
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Toast ──
  const [toast, setToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showToast = (variant, title, message) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ variant, title, message });
    toastTimerRef.current = setTimeout(() => setToast(null), 4000);
  };

  // ── Debounced Search ──
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 350);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [search]);

  // ── Fetch Questions ──
  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminAptitudeQuestions({
        search: debouncedSearch,
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
    debouncedSearch,
    categoryFilter,
    difficultyFilter,
    statusFilter,
    pagination.page,
    pagination.limit,
  ]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // ── Filter Handlers (reset to page 1) ──
  const handleCategoryChange = (e) => {
    setCategoryFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };
  const handleDifficultyChange = (e) => {
    setDifficultyFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters =
    debouncedSearch || categoryFilter || difficultyFilter || statusFilter !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setCategoryFilter("");
    setDifficultyFilter("");
    setStatusFilter("all");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ── Create Modal ──
  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // ── Edit Modal ──
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
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingQuestion(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
  };

  // ── View Modal ──
  const handleOpenViewModal = (q) => {
    setViewQuestion(q);
    setIsViewModalOpen(true);
  };

  // ── Form Submit ──
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

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

    const trimmedOptions = [
      formData.optionA.trim().toLowerCase(),
      formData.optionB.trim().toLowerCase(),
      formData.optionC.trim().toLowerCase(),
      formData.optionD.trim().toLowerCase(),
    ];
    if (new Set(trimmedOptions).size < 4) {
      setFormError("All 4 options must be mutually distinct. Duplicate options are not permitted.");
      return;
    }

    if (!formData.correctOption) {
      setFormError("Please select which option (A, B, C, or D) is the correct answer.");
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
        showToast("success", "Question Updated", "Changes saved successfully.");
      } else {
        await createAptitudeQuestion(payload);
        showToast("success", "Question Created", "New question added to the bank.");
      }
      handleCloseFormModal();
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

  // ── Status Toggle ──
  const handleRequestToggle = (q) => {
    setToggleTarget(q);
    setIsToggleModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const q = toggleTarget;
    try {
      setTogglingId(q._id);
      setIsToggleModalOpen(false);
      const newStatus = !q.isActive;
      await updateAptitudeQuestionStatus(q._id, newStatus);
      setQuestions((prev) =>
        prev.map((item) =>
          item._id === q._id ? { ...item, isActive: newStatus } : item
        )
      );
      showToast(
        "success",
        "Status Updated",
        `Question marked as ${newStatus ? "Active" : "Inactive"}.`
      );
    } catch (err) {
      console.error("Failed to toggle question status:", err);
      showToast("error", "Update Failed", "Could not update status. Please try again.");
    } finally {
      setTogglingId(null);
      setToggleTarget(null);
    }
  };

  // ── Delete Question ──
  const handleRequestDelete = (q) => {
    setDeleteTarget(q);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await deleteAptitudeQuestion(deleteTarget._id);
      showToast(
        "success",
        res?.data?.softDeleted ? "Question Deactivated" : "Question Deleted",
        res?.message || "Question deleted successfully."
      );
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchQuestions();
    } catch (err) {
      console.error("Error deleting aptitude question:", err);
      showToast(
        "error",
        "Delete Failed",
        err.response?.data?.message || "Failed to delete question."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Form Field Updater ──
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Pagination ──
  const paginationStart = (pagination.page - 1) * pagination.limit + 1;
  const paginationEnd = Math.min(
    pagination.page * pagination.limit,
    safeNumber(pagination.total)
  );

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* ── Toast ── */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] w-80 animate-in fade-in slide-in-from-top-2 duration-200">
          <Toast
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      {/* ── Page Header ── */}
      <PageHeader
        title="Aptitude Question Bank"
        description="Author, categorize, and manage aptitude practice questions for student modules."
        badge={
          !loading && (
            <Badge variant="primary" size="sm">
              {safeNumber(pagination.total)} Questions
            </Badge>
          )
        }
        actions={
          <Button
            variant="primary"
            size="md"
            iconLeft={<PlusIcon className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            Add Question
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search question, topic, tags…"
          />
          <Select
            value={categoryFilter}
            onChange={handleCategoryChange}
            options={CATEGORY_OPTIONS}
          />
          <Select
            value={difficultyFilter}
            onChange={handleDifficultyChange}
            options={DIFFICULTY_OPTIONS}
          />
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
          />
        </div>
        {hasActiveFilters && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              Filters active — showing matching results
            </p>
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* ── Main Content ── */}
      {loading ? (
        <div className="bg-white border border-slate-200/80 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Category / Topic</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SkeletonTableRow key={i} cols={6} />
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : error ? (
        <ErrorState
          title="Failed to Load Questions"
          message={error}
          onRetry={fetchQuestions}
        />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon className="w-8 h-8" />}
          title={
            hasActiveFilters
              ? "No questions match your filters"
              : "No aptitude questions yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your search or filter criteria, or add a new question."
              : "The question bank is empty. Add the first question to get started."
          }
          action={
            hasActiveFilters ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearAllFilters}>
                  Clear Filters
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
                  onClick={handleOpenCreateModal}
                >
                  Add Question
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
                onClick={handleOpenCreateModal}
              >
                Add First Question
              </Button>
            )
          }
        />
      ) : (
        <>
          {/* ── Desktop Table ── */}
          <div className="hidden md:block bg-white border border-slate-200/80 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[280px]">Question</TableHead>
                    <TableHead className="min-w-[160px]">Category / Topic</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Marks</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {questions.map((q) => (
                    <TableRow key={q._id}>
                      {/* Question */}
                      <TableCell>
                        <div className="max-w-sm">
                          <p className="text-sm font-medium text-slate-900 line-clamp-2 leading-snug">
                            {q.question || "—"}
                          </p>
                          {q.tags && q.tags.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {q.tags.slice(0, 3).map((tag, idx) => (
                                <Badge key={idx} variant="default" size="sm">
                                  {tag}
                                </Badge>
                              ))}
                              {q.tags.length > 3 && (
                                <span className="text-[11px] text-slate-400 self-center">
                                  +{q.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Category / Topic */}
                      <TableCell>
                        <p className="text-xs font-semibold text-slate-900">
                          {q.category || "—"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {q.topic || "—"}
                        </p>
                      </TableCell>

                      {/* Difficulty */}
                      <TableCell>
                        <Badge variant={getDifficultyVariant(q.difficulty)} size="sm">
                          {capitalize(q.difficulty)}
                        </Badge>
                      </TableCell>

                      {/* Marks */}
                      <TableCell>
                        <span className="text-sm font-medium text-slate-700">
                          {safeNumber(q.marks) || 1}
                        </span>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge status={q.isActive ? "active" : "inactive"} />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenViewModal(q)}
                            title="View details"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(q)}
                            title="Edit question"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant={q.isActive ? "ghost" : "ghost"}
                            size="sm"
                            loading={togglingId === q._id}
                            onClick={() => handleRequestToggle(q)}
                            className={
                              q.isActive
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }
                          >
                            {q.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRequestDelete(q)}
                            title="Delete question"
                            className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          >
                            <TrashIcon className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs text-slate-500">
                Showing{" "}
                <span className="font-semibold text-slate-700">
                  {paginationStart}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-slate-700">
                  {paginationEnd}
                </span>{" "}
                of{" "}
                <span className="font-semibold text-slate-700">
                  {safeNumber(pagination.total)}
                </span>{" "}
                questions
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <span className="text-xs text-slate-600 font-medium px-2">
                  Page {pagination.page} of {pagination.pages || 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= (pagination.pages || 1)}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>

          {/* ── Mobile Cards ── */}
          <div className="md:hidden space-y-3">
            {questions.map((q) => {
              const correctOpt = (q.options || []).find(
                (o) => o.key === q.correctOption
              );
              return (
                <div
                  key={q._id}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3"
                >
                  {/* Top row: badges */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={getDifficultyVariant(q.difficulty)} size="sm">
                      {capitalize(q.difficulty)}
                    </Badge>
                    <StatusBadge status={q.isActive ? "active" : "inactive"} />
                  </div>

                  {/* Question text */}
                  <p className="text-sm font-medium text-slate-900 leading-snug line-clamp-3">
                    {q.question || "—"}
                  </p>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                    <span>{q.category || "—"}</span>
                    <span>•</span>
                    <span>{q.topic || "—"}</span>
                    <span>•</span>
                    <span>{safeNumber(q.marks) || 1} mark{(safeNumber(q.marks) || 1) > 1 ? "s" : ""}</span>
                  </div>

                  {/* Correct answer preview */}
                  <div className="flex items-center gap-2 p-2 bg-emerald-50/60 border border-emerald-100 rounded-lg">
                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold shrink-0">
                      {q.correctOption || "—"}
                    </span>
                    <span className="text-xs text-emerald-800 truncate">
                      {correctOpt ? correctOpt.text : "—"}
                    </span>
                  </div>

                  {/* Tags */}
                  {q.tags && q.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {q.tags.slice(0, 4).map((tag, idx) => (
                        <Badge key={idx} variant="default" size="sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenViewModal(q)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEditModal(q)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${
                        q.isActive
                          ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                          : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      }`}
                      loading={togglingId === q._id}
                      onClick={() => handleRequestToggle(q)}
                    >
                      {q.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 px-2.5"
                      onClick={() => handleRequestDelete(q)}
                      title="Delete question"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Mobile Pagination */}
            <div className="flex items-center justify-between py-2">
              <p className="text-xs text-slate-500">
                Page {pagination.page} of {pagination.pages || 1}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page <= 1}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page - 1 }))
                  }
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.page >= (pagination.pages || 1)}
                  onClick={() =>
                    setPagination((p) => ({ ...p, page: p.page + 1 }))
                  }
                >
                  Next
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── Create / Edit Question Modal ─────────────────────────── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={editingQuestion ? "Edit Aptitude Question" : "Create New Question"}
        description="Configure question text, answer options, metadata, and explanation."
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={handleCloseFormModal}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={formSubmitting}
              onClick={handleFormSubmit}
            >
              {editingQuestion ? "Update Question" : "Create Question"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {/* Form Error */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {formError}
            </div>
          )}

          {/* Question Text */}
          <Textarea
            label="Question Text"
            required
            rows={3}
            value={formData.question}
            onChange={(e) => updateField("question", e.target.value)}
            placeholder="e.g. If 20% of A is equal to 30% of B, what is the ratio of A to B?"
          />

          {/* Category, Topic, Difficulty */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Category"
              required
              value={formData.category}
              onChange={(e) => updateField("category", e.target.value)}
              options={FORM_CATEGORY_OPTIONS}
            />
            <Input
              label="Topic"
              required
              value={formData.topic}
              onChange={(e) => updateField("topic", e.target.value)}
              placeholder="e.g. Ratios & Proportions"
            />
            <Select
              label="Difficulty"
              value={formData.difficulty}
              onChange={(e) => updateField("difficulty", e.target.value)}
              options={FORM_DIFFICULTY_OPTIONS}
            />
          </div>

          {/* Answer Options */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Answer Options <span className="text-red-500">*</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Select the correct answer
              </span>
            </div>

            {["A", "B", "C", "D"].map((key) => {
              const fieldName = `option${key}`;
              const isCorrect = formData.correctOption === key;
              return (
                <div
                  key={key}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg border transition-colors ${
                    isCorrect
                      ? "border-emerald-300 bg-emerald-50/50"
                      : "border-slate-200 bg-slate-50/40"
                  }`}
                >
                  <input
                    type="radio"
                    id={`radio-opt-${key}`}
                    name="correctOption"
                    checked={isCorrect}
                    onChange={() => updateField("correctOption", key)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <label
                    htmlFor={`radio-opt-${key}`}
                    className="text-xs font-bold text-slate-700 w-5 text-center cursor-pointer select-none"
                  >
                    {key}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData[fieldName]}
                    onChange={(e) => updateField(fieldName, e.target.value)}
                    placeholder={`Option ${key} text`}
                    className="flex-1 h-8 px-3 text-sm bg-white border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              );
            })}
          </div>

          {/* Explanation */}
          <Textarea
            label="Detailed Explanation / Solution"
            required
            rows={3}
            value={formData.explanation}
            onChange={(e) => updateField("explanation", e.target.value)}
            placeholder="Explain step-by-step how the correct answer is derived…"
          />

          {/* Marks, Tags, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Marks"
              type="number"
              value={formData.marks}
              onChange={(e) => updateField("marks", e.target.value)}
              placeholder="1"
            />
            <div className="sm:col-span-2">
              <Input
                label="Tags (comma separated)"
                value={formData.tags}
                onChange={(e) => updateField("tags", e.target.value)}
                placeholder="e.g. tcs, infosys, formulas"
                helperText="Optional. Helps with search and categorization."
              />
            </div>
          </div>

          {/* Active Toggle */}
          <div className="flex items-center gap-2.5 pt-1">
            <input
              type="checkbox"
              id="form-active-toggle"
              checked={formData.isActive}
              onChange={(e) => updateField("isActive", e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <label
              htmlFor="form-active-toggle"
              className="text-xs font-medium text-slate-700 cursor-pointer select-none"
            >
              Active — visible to the question engine
            </label>
          </div>
        </form>
      </Modal>

      {/* ─── View Question Detail Modal ───────────────────────────── */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Question Details"
        description={viewQuestion ? `${viewQuestion.category} • ${viewQuestion.topic}` : ""}
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setIsViewModalOpen(false)}>
              Close
            </Button>
            {viewQuestion && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<EditIcon className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(viewQuestion);
                }}
              >
                Edit Question
              </Button>
            )}
          </>
        }
      >
        {viewQuestion && (
          <div className="space-y-5">
            {/* Question Text */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Question
              </h4>
              <p className="text-sm text-slate-900 leading-relaxed">
                {viewQuestion.question}
              </p>
            </div>

            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={getDifficultyVariant(viewQuestion.difficulty)} size="sm">
                {capitalize(viewQuestion.difficulty)}
              </Badge>
              <Badge variant="default" size="sm">
                {safeNumber(viewQuestion.marks) || 1} Mark{(safeNumber(viewQuestion.marks) || 1) > 1 ? "s" : ""}
              </Badge>
              <StatusBadge status={viewQuestion.isActive ? "active" : "inactive"} />
            </div>

            {/* Options */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Answer Options
              </h4>
              <div className="space-y-2">
                {(viewQuestion.options || []).map((opt) => {
                  const isCorrect = opt.key === viewQuestion.correctOption;
                  return (
                    <div
                      key={opt.key}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCorrect
                          ? "bg-emerald-50/60 border-emerald-200"
                          : "bg-slate-50/40 border-slate-200"
                      }`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                          isCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {opt.key}
                      </span>
                      <span className="text-sm text-slate-800 flex-1">
                        {opt.text}
                      </span>
                      {isCorrect && (
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Explanation */}
            {viewQuestion.explanation && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Explanation
                </h4>
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-900 leading-relaxed">
                    {viewQuestion.explanation}
                  </p>
                </div>
              </div>
            )}

            {/* Tags */}
            {viewQuestion.tags && viewQuestion.tags.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewQuestion.tags.map((tag, idx) => (
                    <Badge key={idx} variant="default" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ─── Status Toggle Confirmation Modal ─────────────────────── */}
      <Modal
        isOpen={isToggleModalOpen}
        onClose={() => {
          setIsToggleModalOpen(false);
          setToggleTarget(null);
        }}
        title={
          toggleTarget?.isActive
            ? "Deactivate Question?"
            : "Activate Question?"
        }
        description={
          toggleTarget?.isActive
            ? "This question will be hidden from student practice sessions."
            : "This question will become visible in student practice sessions."
        }
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsToggleModalOpen(false);
                setToggleTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant={toggleTarget?.isActive ? "danger" : "success"}
              size="sm"
              onClick={handleConfirmToggle}
            >
              {toggleTarget?.isActive ? "Deactivate" : "Activate"}
            </Button>
          </>
        }
      >
        {toggleTarget && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-800 line-clamp-3">
              {truncateText(toggleTarget.question, 200)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getDifficultyVariant(toggleTarget.difficulty)} size="sm">
                {capitalize(toggleTarget.difficulty)}
              </Badge>
              <span className="text-xs text-slate-500">
                {toggleTarget.category} • {toggleTarget.topic}
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Delete Confirmation Modal ───────────────────────────── */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
        title="Delete Question?"
        description="Are you sure you want to delete this question? If students have attempted this question or it belongs to a mock test, it will be deactivated to protect historical student records."
        maxWidth="max-w-md"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => {
                setIsDeleteModalOpen(false);
                setDeleteTarget(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              loading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Delete
            </Button>
          </>
        }
      >
        {deleteTarget && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <p className="text-sm text-slate-800 line-clamp-3">
              {truncateText(deleteTarget.question, 200)}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={getDifficultyVariant(deleteTarget.difficulty)} size="sm">
                {capitalize(deleteTarget.difficulty)}
              </Badge>
              <span className="text-xs text-slate-500">
                {deleteTarget.category} • {deleteTarget.topic}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
