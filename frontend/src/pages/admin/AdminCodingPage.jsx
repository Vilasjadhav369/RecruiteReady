import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getAdminCodingProblems,
  createCodingProblem,
  getAdminCodingProblemById,
  updateCodingProblem,
  updateCodingProblemStatus,
  deleteCodingProblem,
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
  StatusBadge,
  SkeletonTableRow,
} from "../../components/ui/index.js";
import {
  PlusIcon,
  EditIcon,
  EyeIcon,
  DocumentIcon,
  TrashIcon,
} from "../../components/ui/Icons.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const DIFFICULTY_FILTER_OPTIONS = [
  { value: "", label: "All Difficulties" },
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
];

const FORM_DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" },
];

const ALL_LANGUAGES = ["javascript", "python", "java", "cpp"];

const LANGUAGE_LABELS = {
  javascript: "JavaScript",
  python: "Python",
  java: "Java",
  cpp: "C++",
};

const INITIAL_FORM_STATE = {
  title: "",
  slug: "",
  difficulty: "medium",
  category: "",
  topics: "",
  description: "",
  constraints: "",
  inputFormat: "",
  outputFormat: "",
  solutionExplanation: "",
  companies: "",
  supportedLanguages: ["javascript", "python", "java", "cpp"],
  isActive: true,
  // Examples (single example for simplicity — matches existing behavior)
  sampleInput: "",
  sampleOutput: "",
  sampleExplanation: "",
  // Test case (single public test case — matches existing behavior)
  testInput: "",
  testExpectedOutput: "",
  testIsHidden: false,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  typeof s === "string" && s.length > 0
    ? s.charAt(0).toUpperCase() + s.slice(1)
    : "—";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminCodingPage() {
  // ── Data State ──
  const [problems, setProblems] = useState([]);
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
  const [difficultyFilter, setDifficultyFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const searchTimerRef = useRef(null);

  // ── Create / Edit Modal ──
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingProblem, setEditingProblem] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── View Detail Modal ──
  const [viewProblem, setViewProblem] = useState(null);
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

  // ── Fetch Problems ──
  const fetchProblems = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (difficultyFilter) params.difficulty = difficultyFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await getAdminCodingProblems(params);
      setProblems(data?.problems || []);
      setPagination(
        data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      );
    } catch (err) {
      console.error("Fetch coding problems error:", err);
      setError(
        err.response?.data?.message || "Failed to load coding problems."
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, difficultyFilter, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  // ── Filter Handlers ──
  const handleDifficultyChange = (e) => {
    setDifficultyFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters =
    debouncedSearch || difficultyFilter || statusFilter !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setDifficultyFilter("");
    setStatusFilter("all");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ── Form Field Updater ──
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Create Modal ──
  const handleOpenCreateModal = () => {
    setEditingProblem(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // ── Edit Modal ──
  const handleOpenEditModal = (problem) => {
    setEditingProblem(problem);

    setFormData({
      title: problem.title || "",
      slug: problem.slug || "",
      difficulty: problem.difficulty || "medium",
      category: problem.category || "",
      topics: (problem.topics || []).join(", "),
      description: problem.description || "",
      constraints: (problem.constraints || []).join("\n"),
      inputFormat: problem.inputFormat || "",
      outputFormat: problem.outputFormat || "",
      solutionExplanation: problem.solutionExplanation || "",
      companies: (problem.companies || []).join(", "),
      supportedLanguages: problem.supportedLanguages || [
        "javascript",
        "python",
        "java",
        "cpp",
      ],
      isActive: problem.isActive ?? true,
      sampleInput: problem.examples?.[0]?.input || "",
      sampleOutput: problem.examples?.[0]?.output || "",
      sampleExplanation: problem.examples?.[0]?.explanation || "",
      testInput: problem.testCases?.[0]?.input || "",
      testExpectedOutput: problem.testCases?.[0]?.expectedOutput || "",
      testIsHidden: problem.testCases?.[0]?.isHidden || false,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingProblem(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
  };

  // ── View Detail Modal ──
  const handleOpenViewModal = async (problem) => {
    try {
      setViewLoading(true);
      setIsViewModalOpen(true);
      setViewProblem(problem); // Show what we have immediately
      const full = await getAdminCodingProblemById(problem._id);
      if (full) setViewProblem(full);
    } catch (err) {
      console.error("Failed to load problem details:", err);
      // Fall back to the list data we already have
    } finally {
      setViewLoading(false);
    }
  };

  // ── Form Submit ──
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError("Problem title is required.");
      return;
    }
    if (!formData.description.trim()) {
      setFormError("Problem description is required.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      slug:
        formData.slug.trim() ||
        formData.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      difficulty: formData.difficulty,
      category: formData.category.trim() || "Core Algorithms",
      topics: formData.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      description: formData.description.trim(),
      constraints: formData.constraints
        .split("\n")
        .map((c) => c.trim())
        .filter(Boolean),
      inputFormat: formData.inputFormat.trim(),
      outputFormat: formData.outputFormat.trim(),
      solutionExplanation: formData.solutionExplanation.trim(),
      companies: formData.companies
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean),
      supportedLanguages:
        formData.supportedLanguages.length > 0
          ? formData.supportedLanguages
          : ["javascript", "python", "java", "cpp"],
      examples: formData.sampleInput.trim()
        ? [
            {
              input: formData.sampleInput.trim(),
              output: formData.sampleOutput.trim() || "",
              explanation: formData.sampleExplanation.trim() || "",
            },
          ]
        : [],
      testCases: formData.testInput.trim()
        ? [
            {
              input: formData.testInput.trim(),
              expectedOutput: formData.testExpectedOutput.trim() || "",
              isHidden: formData.testIsHidden,
            },
          ]
        : [],
      isActive: formData.isActive,
    };

    try {
      setFormSubmitting(true);
      if (editingProblem) {
        await updateCodingProblem(editingProblem._id, payload);
        showToast("success", "Problem Updated", "Changes saved successfully.");
      } else {
        await createCodingProblem(payload);
        showToast(
          "success",
          "Problem Created",
          "New coding problem added to the bank."
        );
      }
      handleCloseFormModal();
      fetchProblems();
    } catch (err) {
      console.error("Error saving problem:", err);
      setFormError(
        err.response?.data?.message ||
          "Failed to save problem. Please check fields."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Status Toggle ──
  const handleRequestToggle = (problem) => {
    setToggleTarget(problem);
    setIsToggleModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const p = toggleTarget;
    try {
      setTogglingId(p._id);
      setIsToggleModalOpen(false);
      const newStatus = !p.isActive;
      const updated = await updateCodingProblemStatus(p._id, newStatus);
      setProblems((prev) =>
        prev.map((item) =>
          item._id === p._id
            ? { ...item, isActive: updated?.isActive ?? newStatus }
            : item
        )
      );
      showToast(
        "success",
        "Status Updated",
        `"${p.title}" is now ${newStatus ? "Active" : "Inactive"}.`
      );
    } catch (err) {
      console.error("Failed to toggle problem status:", err);
      showToast(
        "error",
        "Update Failed",
        "Could not update status. Please try again."
      );
    } finally {
      setTogglingId(null);
      setToggleTarget(null);
    }
  };

  // ── Delete Coding Problem ──
  const handleRequestDelete = (problem) => {
    setDeleteTarget(problem);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await deleteCodingProblem(deleteTarget._id);
      showToast(
        "success",
        res?.data?.softDeleted ? "Problem Deactivated" : "Problem Deleted",
        res?.message || "Coding problem deleted successfully."
      );
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchProblems();
    } catch (err) {
      console.error("Error deleting coding problem:", err);
      showToast(
        "error",
        "Delete Failed",
        err.response?.data?.message || "Failed to delete coding problem."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Language Toggle in Form ──
  const toggleLanguage = (lang) => {
    setFormData((prev) => {
      const langs = prev.supportedLanguages.includes(lang)
        ? prev.supportedLanguages.filter((l) => l !== lang)
        : [...prev.supportedLanguages, lang];
      return { ...prev, supportedLanguages: langs };
    });
  };

  // ── Pagination ──
  const paginationStart =
    safeNumber(pagination.total) > 0
      ? (pagination.page - 1) * pagination.limit + 1
      : 0;
  const paginationEnd = Math.min(
    pagination.page * pagination.limit,
    safeNumber(pagination.total)
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

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
        title="Coding Problems"
        description="Create and manage coding problems for placement practice."
        badge={
          !loading && (
            <Badge variant="primary" size="sm">
              {safeNumber(pagination.total)} Problems
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
            Add Problem
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch("")}
            placeholder="Search by title or topic…"
          />
          <Select
            value={difficultyFilter}
            onChange={handleDifficultyChange}
            options={DIFFICULTY_FILTER_OPTIONS}
          />
          <Select
            value={statusFilter}
            onChange={handleStatusChange}
            options={STATUS_FILTER_OPTIONS}
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Problem</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Languages</TableHead>
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
      ) : error ? (
        <ErrorState
          title="Unable to Load Coding Problems"
          message={error}
          onRetry={fetchProblems}
        />
      ) : problems.length === 0 ? (
        <EmptyState
          icon={<DocumentIcon className="w-8 h-8" />}
          title={
            hasActiveFilters
              ? "No problems match your filters"
              : "No coding problems yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your search or filter criteria, or add a new problem."
              : "The coding problem bank is empty. Add the first problem to get started."
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
                  Add Problem
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
                onClick={handleOpenCreateModal}
              >
                Add First Problem
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
                    <TableHead className="min-w-[260px]">Problem</TableHead>
                    <TableHead>Difficulty</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="min-w-[140px]">Languages</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {problems.map((p) => (
                    <TableRow key={p._id}>
                      {/* Problem */}
                      <TableCell>
                        <div className="max-w-sm">
                          <p className="text-sm font-medium text-slate-900 leading-snug">
                            {p.title || "—"}
                          </p>
                          <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                            /{p.slug || "—"}
                          </p>
                          {p.topics && p.topics.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1">
                              {p.topics.slice(0, 3).map((topic, idx) => (
                                <Badge key={idx} variant="default" size="sm">
                                  {topic}
                                </Badge>
                              ))}
                              {p.topics.length > 3 && (
                                <span className="text-[11px] text-slate-400 self-center">
                                  +{p.topics.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>

                      {/* Difficulty */}
                      <TableCell>
                        <Badge
                          variant={getDifficultyVariant(p.difficulty)}
                          size="sm"
                        >
                          {capitalize(p.difficulty)}
                        </Badge>
                      </TableCell>

                      {/* Category */}
                      <TableCell>
                        <span className="text-xs text-slate-700">
                          {p.category || "—"}
                        </span>
                      </TableCell>

                      {/* Languages */}
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {(p.supportedLanguages || [])
                            .slice(0, 4)
                            .map((lang, idx) => (
                              <span
                                key={idx}
                                className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded"
                              >
                                {LANGUAGE_LABELS[lang] || lang}
                              </span>
                            ))}
                        </div>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusBadge
                          status={p.isActive ? "active" : "inactive"}
                        />
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenViewModal(p)}
                            title="View details"
                          >
                            <EyeIcon className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditModal(p)}
                            title="Edit problem"
                          >
                            <EditIcon className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            loading={togglingId === p._id}
                            onClick={() => handleRequestToggle(p)}
                            className={
                              p.isActive
                                ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            }
                          >
                            {p.isActive ? "Deactivate" : "Activate"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRequestDelete(p)}
                            title="Delete problem"
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
                problems
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
            {problems.map((p) => (
              <div
                key={p._id}
                className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3"
              >
                {/* Top row: difficulty + status */}
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={getDifficultyVariant(p.difficulty)}
                    size="sm"
                  >
                    {capitalize(p.difficulty)}
                  </Badge>
                  <StatusBadge status={p.isActive ? "active" : "inactive"} />
                </div>

                {/* Title & slug */}
                <div>
                  <p className="text-sm font-medium text-slate-900 leading-snug">
                    {p.title || "—"}
                  </p>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    /{p.slug || "—"}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span>{p.category || "—"}</span>
                  {p.topics && p.topics.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{p.topics.slice(0, 2).join(", ")}</span>
                    </>
                  )}
                </div>

                {/* Languages */}
                {p.supportedLanguages && p.supportedLanguages.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {p.supportedLanguages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded"
                      >
                        {LANGUAGE_LABELS[lang] || lang}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenViewModal(p)}
                  >
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleOpenEditModal(p)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`flex-1 ${
                      p.isActive
                        ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                        : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                    }`}
                    loading={togglingId === p._id}
                    onClick={() => handleRequestToggle(p)}
                  >
                    {p.isActive ? "Deactivate" : "Activate"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 px-2.5"
                    onClick={() => handleRequestDelete(p)}
                    title="Delete problem"
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}

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

      {/* ─── Create / Edit Problem Modal ──────────────────────────────────── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={
          editingProblem ? "Edit Coding Problem" : "Create New Coding Problem"
        }
        description="Configure problem details, examples, constraints, and test cases."
        maxWidth="max-w-3xl"
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
              {editingProblem ? "Update Problem" : "Create Problem"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-5">
          {/* Form Error */}
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium">
              {formError}
            </div>
          )}

          {/* ── Section: Problem Details ── */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Problem Details
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Title"
                required
                value={formData.title}
                onChange={(e) => updateField("title", e.target.value)}
                placeholder="e.g. Reverse Linked List"
              />
              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="reverse-linked-list (auto-generated)"
                helperText="Auto-generated from title if left empty."
                className="font-mono text-xs"
              />
            </div>
            <Textarea
              label="Problem Description"
              required
              rows={5}
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Explain the problem clearly, including input expectations…"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Difficulty"
                value={formData.difficulty}
                onChange={(e) => updateField("difficulty", e.target.value)}
                options={FORM_DIFFICULTY_OPTIONS}
              />
              <Input
                label="Category"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                placeholder="e.g. Data Structures"
              />
              <Input
                label="Topics (comma separated)"
                value={formData.topics}
                onChange={(e) => updateField("topics", e.target.value)}
                placeholder="Array, Hash Table"
              />
            </div>
          </div>

          {/* ── Section: Problem Specification ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Problem Specification
            </h4>
            <Textarea
              label="Constraints"
              rows={2}
              value={formData.constraints}
              onChange={(e) => updateField("constraints", e.target.value)}
              placeholder="One constraint per line, e.g. 1 ≤ N ≤ 10^5"
              helperText="Enter one constraint per line."
              className="font-mono text-xs"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Input Format"
                value={formData.inputFormat}
                onChange={(e) => updateField("inputFormat", e.target.value)}
                placeholder="e.g. A single integer N"
              />
              <Input
                label="Output Format"
                value={formData.outputFormat}
                onChange={(e) => updateField("outputFormat", e.target.value)}
                placeholder="e.g. Returned integer value"
              />
            </div>
          </div>

          {/* ── Section: Example ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Sample Example
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Textarea
                label="Sample Input"
                rows={2}
                value={formData.sampleInput}
                onChange={(e) => updateField("sampleInput", e.target.value)}
                placeholder="4\n1 2 3 4"
                className="font-mono text-xs"
              />
              <Textarea
                label="Sample Output"
                rows={2}
                value={formData.sampleOutput}
                onChange={(e) => updateField("sampleOutput", e.target.value)}
                placeholder="10"
                className="font-mono text-xs"
              />
            </div>
            <Input
              label="Explanation"
              value={formData.sampleExplanation}
              onChange={(e) =>
                updateField("sampleExplanation", e.target.value)
              }
              placeholder="e.g. Sum of elements is 10"
            />
          </div>

          {/* ── Section: Test Case ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between pt-1">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Test Case
              </h4>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="test-hidden-toggle"
                  checked={formData.testIsHidden}
                  onChange={(e) =>
                    updateField("testIsHidden", e.target.checked)
                  }
                  className="w-3.5 h-3.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                />
                <label
                  htmlFor="test-hidden-toggle"
                  className="text-[11px] font-medium text-slate-600 cursor-pointer select-none"
                >
                  Hidden test case
                </label>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Textarea
                label="Test Input"
                rows={2}
                value={formData.testInput}
                onChange={(e) => updateField("testInput", e.target.value)}
                placeholder="Test case input"
                className="font-mono text-xs"
              />
              <Textarea
                label="Expected Output"
                rows={2}
                value={formData.testExpectedOutput}
                onChange={(e) =>
                  updateField("testExpectedOutput", e.target.value)
                }
                placeholder="Expected test output"
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* ── Section: Code Configuration ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Code Configuration
            </h4>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Supported Languages
              </label>
              <div className="flex flex-wrap gap-2">
                {ALL_LANGUAGES.map((lang) => {
                  const isSelected =
                    formData.supportedLanguages.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => toggleLanguage(lang)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {LANGUAGE_LABELS[lang]}
                    </button>
                  );
                })}
              </div>
            </div>
            <Textarea
              label="Solution Explanation"
              rows={2}
              value={formData.solutionExplanation}
              onChange={(e) =>
                updateField("solutionExplanation", e.target.value)
              }
              placeholder="Optional solution approach or editorial…"
            />
          </div>

          {/* ── Section: Metadata ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Metadata
            </h4>
            <Input
              label="Companies (comma separated)"
              value={formData.companies}
              onChange={(e) => updateField("companies", e.target.value)}
              placeholder="e.g. Google, Amazon, Microsoft"
              helperText="Optional. Companies that ask this problem."
            />
            <div className="flex items-center gap-2.5">
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
                Active — visible to students for practice
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── View Problem Detail Modal ────────────────────────────────────── */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewProblem(null);
        }}
        title={viewProblem?.title || "Problem Details"}
        description={
          viewProblem
            ? `${viewProblem.category || "—"} • ${capitalize(viewProblem.difficulty)}`
            : ""
        }
        maxWidth="max-w-3xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsViewModalOpen(false);
                setViewProblem(null);
              }}
            >
              Close
            </Button>
            {viewProblem && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<EditIcon className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(viewProblem);
                }}
              >
                Edit Problem
              </Button>
            )}
          </>
        }
      >
        {viewProblem && (
          <div className="space-y-5">
            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={getDifficultyVariant(viewProblem.difficulty)}
                size="sm"
              >
                {capitalize(viewProblem.difficulty)}
              </Badge>
              <StatusBadge
                status={viewProblem.isActive ? "active" : "inactive"}
              />
              <span className="text-[11px] text-slate-400 font-mono">
                /{viewProblem.slug}
              </span>
            </div>

            {/* Topics */}
            {viewProblem.topics && viewProblem.topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {viewProblem.topics.map((topic, idx) => (
                  <Badge key={idx} variant="default" size="sm">
                    {topic}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Description
              </h4>
              <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                {viewProblem.description || "—"}
              </div>
            </div>

            {/* Constraints */}
            {viewProblem.constraints && viewProblem.constraints.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Constraints
                </h4>
                <ul className="space-y-1">
                  {viewProblem.constraints.map((c, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-700 font-mono bg-slate-50 px-3 py-1.5 rounded-md border border-slate-200"
                    >
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Input/Output Format */}
            {(viewProblem.inputFormat || viewProblem.outputFormat) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {viewProblem.inputFormat && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Input Format
                    </h4>
                    <p className="text-xs text-slate-700">
                      {viewProblem.inputFormat}
                    </p>
                  </div>
                )}
                {viewProblem.outputFormat && (
                  <div>
                    <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                      Output Format
                    </h4>
                    <p className="text-xs text-slate-700">
                      {viewProblem.outputFormat}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Examples */}
            {viewProblem.examples && viewProblem.examples.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Examples
                </h4>
                <div className="space-y-3">
                  {viewProblem.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg overflow-hidden"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2">
                        <div className="p-3 border-b sm:border-b-0 sm:border-r border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            Input
                          </span>
                          <pre className="mt-1 text-xs text-slate-800 font-mono whitespace-pre-wrap">
                            {ex.input || "—"}
                          </pre>
                        </div>
                        <div className="p-3">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            Output
                          </span>
                          <pre className="mt-1 text-xs text-slate-800 font-mono whitespace-pre-wrap">
                            {ex.output || "—"}
                          </pre>
                        </div>
                      </div>
                      {ex.explanation && (
                        <div className="p-3 bg-slate-50 border-t border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            Explanation
                          </span>
                          <p className="mt-0.5 text-xs text-slate-700">
                            {ex.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Cases (admin view — only show count + public/hidden breakdown) */}
            {viewProblem.testCases && viewProblem.testCases.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Test Cases
                </h4>
                <div className="space-y-2">
                  {viewProblem.testCases.map((tc, idx) => (
                    <div
                      key={idx}
                      className="border border-slate-200 rounded-lg overflow-hidden"
                    >
                      <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200">
                        <span className="text-[11px] font-semibold text-slate-600">
                          Test Case {idx + 1}
                        </span>
                        <Badge
                          variant={tc.isHidden ? "warning" : "default"}
                          size="sm"
                        >
                          {tc.isHidden ? "Hidden" : "Public"}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2">
                        <div className="p-3 border-b sm:border-b-0 sm:border-r border-slate-200">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            Input
                          </span>
                          <pre className="mt-1 text-xs text-slate-800 font-mono whitespace-pre-wrap">
                            {tc.input || "—"}
                          </pre>
                        </div>
                        <div className="p-3">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">
                            Expected Output
                          </span>
                          <pre className="mt-1 text-xs text-slate-800 font-mono whitespace-pre-wrap">
                            {tc.expectedOutput || "—"}
                          </pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Supported Languages */}
            {viewProblem.supportedLanguages &&
              viewProblem.supportedLanguages.length > 0 && (
                <div>
                  <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Supported Languages
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {viewProblem.supportedLanguages.map((lang, idx) => (
                      <Badge key={idx} variant="info" size="sm">
                        {LANGUAGE_LABELS[lang] || lang}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Companies */}
            {viewProblem.companies && viewProblem.companies.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Companies
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {viewProblem.companies.map((company, idx) => (
                    <Badge key={idx} variant="default" size="sm">
                      {company}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Solution Explanation */}
            {viewProblem.solutionExplanation && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Solution Explanation
                </h4>
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
                  <p className="text-xs text-blue-900 leading-relaxed whitespace-pre-wrap">
                    {viewProblem.solutionExplanation}
                  </p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              {viewProblem.createdAt && (
                <span>Created: {formatDate(viewProblem.createdAt)}</span>
              )}
              {viewProblem.updatedAt && (
                <span>Updated: {formatDate(viewProblem.updatedAt)}</span>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* ─── Status Toggle Confirmation Modal ─────────────────────────────── */}
      <Modal
        isOpen={isToggleModalOpen}
        onClose={() => {
          setIsToggleModalOpen(false);
          setToggleTarget(null);
        }}
        title={
          toggleTarget?.isActive
            ? "Deactivate Problem?"
            : "Activate Problem?"
        }
        description={
          toggleTarget?.isActive
            ? "This problem will be hidden from student practice sessions."
            : "This problem will become visible in student practice sessions."
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
            <p className="text-sm font-medium text-slate-800">
              {toggleTarget.title || "—"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={getDifficultyVariant(toggleTarget.difficulty)}
                size="sm"
              >
                {capitalize(toggleTarget.difficulty)}
              </Badge>
              <span className="text-xs text-slate-500">
                {toggleTarget.category || "—"}
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
        title="Delete Coding Problem?"
        description="Are you sure you want to delete this coding problem? If students have submitted solutions to this problem, it will be deactivated to protect historical student records."
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
            <p className="text-sm font-medium text-slate-800">
              {deleteTarget.title || "—"}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge
                variant={getDifficultyVariant(deleteTarget.difficulty)}
                size="sm"
              >
                {capitalize(deleteTarget.difficulty)}
              </Badge>
              <span className="text-xs text-slate-500">
                {deleteTarget.category || "—"}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
