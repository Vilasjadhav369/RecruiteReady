import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getAdminCompanies,
  createCompany,
  getAdminCompanyById,
  updateCompany,
  updateCompanyStatus,
  deleteCompany,
} from "../../services/adminService.js";
import {
  PageHeader,
  Badge,
  StatusBadge,
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
} from "../../components/ui/index.js";
import {
  CompanyIcon,
  PlusIcon,
  EditIcon,
  EyeIcon,
  ExternalLinkIcon,
  TrashIcon,
} from "../../components/ui/Icons.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Hidden / Inactive" },
];

const INITIAL_FORM_STATE = {
  name: "",
  slug: "",
  logoUrl: "",
  industry: "Technology",
  description: "",
  website: "",
  careersUrl: "",
  roles: "",
  eligibility: "",
  selectionProcess: "",
  aptitudeTopics: "",
  codingTopics: "",
  interviewTopics: "",
  isFeatured: false,
  minCgpa: "",
  allowedBranches: "",
  allowedGraduationYears: "",
  maxBacklogs: "",
  isActive: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "object") return Number(val.total ?? val.count ?? 0) || 0;
  return Number(val) || 0;
};

const getInitials = (name) => {
  if (!name || typeof name !== "string") return "CO";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
};

const sanitizeUrl = (url) => {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

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

// ─── Company Logo Component ───────────────────────────────────────────────────

function CompanyLogo({ src, name, size = "md" }) {
  const [imageFailed, setImageFailed] = useState(false);

  // Reset error state if src changes
  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-10 h-10 text-xs font-semibold",
    lg: "w-12 h-12 text-sm font-semibold",
  };

  const currentSize = sizeClasses[size] || sizeClasses.md;

  if (src && !imageFailed) {
    return (
      <img
        src={src}
        alt={name || "Company logo"}
        onError={() => setImageFailed(true)}
        className={`${currentSize} rounded-lg object-contain bg-slate-50 border border-slate-200/80 p-1 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${currentSize} rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0 tracking-wider shadow-xs select-none`}
      aria-label={name}
    >
      {getInitials(name)}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminCompaniesPage() {
  // ── Data State ──
  const [companies, setCompanies] = useState([]);
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
  const [statusFilter, setStatusFilter] = useState("all");
  const searchTimerRef = useRef(null);

  // ── Create / Edit Modal ──
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── View Detail Modal ──
  const [viewCompany, setViewCompany] = useState(null);
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

  // ── Fetch Companies ──
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await getAdminCompanies(params);
      setCompanies(data?.companies || []);
      setPagination(
        data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      );
    } catch (err) {
      console.error("Fetch companies error:", err);
      setError(
        err.response?.data?.message || "Failed to load company profiles."
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // ── Filter Handlers ──
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters = debouncedSearch || statusFilter !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("all");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ── Form Field Updater ──
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Create Modal ──
  const handleOpenCreateModal = () => {
    setEditingCompany(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // ── Edit Modal ──
  const handleOpenEditModal = (c) => {
    setEditingCompany(c);
    setFormData({
      name: c.name || "",
      slug: c.slug || "",
      logoUrl: c.logoUrl || "",
      industry: c.industry || "Technology",
      description: c.description || "",
      website: c.website || "",
      careersUrl: c.careersUrl || "",
      roles: (c.roles || []).join(", "),
      eligibility: c.eligibility || "",
      selectionProcess: (c.selectionProcess || []).join("\n"),
      aptitudeTopics: (c.aptitudeTopics || []).join(", "),
      codingTopics: (c.codingTopics || []).join(", "),
      interviewTopics: (c.interviewTopics || []).join(", "),
      isFeatured: c.isFeatured ?? false,
      minCgpa:
        c.eligibilityCriteria?.minCgpa != null
          ? String(c.eligibilityCriteria.minCgpa)
          : "",
      allowedBranches: (c.eligibilityCriteria?.allowedBranches || []).join(", "),
      allowedGraduationYears: (
        c.eligibilityCriteria?.allowedGraduationYears || []
      ).join(", "),
      maxBacklogs:
        c.eligibilityCriteria?.maxBacklogs != null
          ? String(c.eligibilityCriteria.maxBacklogs)
          : "",
      isActive: c.isActive ?? true,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingCompany(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
  };

  // ── View Detail Modal ──
  const handleOpenViewModal = async (company) => {
    setIsViewModalOpen(true);
    setViewCompany(company); // Render immediately
    try {
      const full = await getAdminCompanyById(company._id);
      if (full) setViewCompany(full);
    } catch (err) {
      console.error("Failed to load company detail:", err);
    }
  };

  // ── Form Submit ──
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Company name is required.");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      slug:
        formData.slug.trim() ||
        formData.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, ""),
      logoUrl: formData.logoUrl.trim(),
      industry: formData.industry.trim() || "Technology",
      description: formData.description.trim(),
      website: formData.website.trim(),
      careersUrl: formData.careersUrl.trim(),
      roles: formData.roles
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean),
      eligibility: formData.eligibility.trim(),
      selectionProcess: formData.selectionProcess
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
      aptitudeTopics: formData.aptitudeTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      codingTopics: formData.codingTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      interviewTopics: formData.interviewTopics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      isFeatured: Boolean(formData.isFeatured),
      eligibilityCriteria: {
        minCgpa:
          formData.minCgpa !== "" && !isNaN(parseFloat(formData.minCgpa))
            ? parseFloat(formData.minCgpa)
            : undefined,
        allowedBranches: formData.allowedBranches
          ? formData.allowedBranches
              .split(",")
              .map((b) => b.trim())
              .filter(Boolean)
          : [],
        allowedGraduationYears: formData.allowedGraduationYears
          ? formData.allowedGraduationYears
              .split(",")
              .map((y) => parseInt(y.trim(), 10))
              .filter((y) => !isNaN(y))
          : [],
        maxBacklogs:
          formData.maxBacklogs !== "" &&
          !isNaN(parseInt(formData.maxBacklogs, 10))
            ? parseInt(formData.maxBacklogs, 10)
            : undefined,
      },
      isActive: formData.isActive,
    };

    try {
      setFormSubmitting(true);
      if (editingCompany) {
        await updateCompany(editingCompany._id, payload);
        showToast("success", "Company Updated", "Company profile saved successfully.");
      } else {
        await createCompany(payload);
        showToast("success", "Company Added", "New company profile created successfully.");
      }
      handleCloseFormModal();
      fetchCompanies();
    } catch (err) {
      console.error("Save company error:", err);
      setFormError(
        err.response?.data?.message || "Failed to save company profile. Please check fields."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Status Toggle ──
  const handleRequestToggle = (company) => {
    setToggleTarget(company);
    setIsToggleModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const c = toggleTarget;
    try {
      setTogglingId(c._id);
      setIsToggleModalOpen(false);
      const newStatus = !c.isActive;
      const updated = await updateCompanyStatus(c._id, newStatus);
      setCompanies((prev) =>
        prev.map((item) =>
          item._id === c._id
            ? { ...item, isActive: updated?.isActive ?? newStatus }
            : item
        )
      );
      showToast(
        "success",
        "Status Updated",
        `"${c.name}" is now ${newStatus ? "Active" : "Hidden"}.`
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast(
        "error",
        "Update Failed",
        "Failed to update company visibility. Please try again."
      );
    } finally {
      setTogglingId(null);
      setToggleTarget(null);
    }
  };

  // ── Delete Company ──
  const handleRequestDelete = (company) => {
    setDeleteTarget(company);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      const res = await deleteCompany(deleteTarget._id);
      showToast(
        "success",
        res?.data?.softDeleted ? "Company Hidden" : "Company Deleted",
        res?.message || "Company profile deleted successfully."
      );
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchCompanies();
    } catch (err) {
      console.error("Error deleting company:", err);
      showToast(
        "error",
        "Delete Failed",
        err.response?.data?.message || "Failed to delete company."
      );
    } finally {
      setIsDeleting(false);
    }
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
        title="Companies"
        description="Manage company information and placement preparation resources."
        badge={
          !loading && (
            <Badge variant="primary" size="sm">
              {safeNumber(pagination.total)} Companies
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
            Add Company
          </Button>
        }
      />

      {/* ── Filters ── */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClear={() => setSearch("")}
              placeholder="Search companies by name or industry…"
            />
          </div>
          <div>
            <Select
              value={statusFilter}
              onChange={handleStatusChange}
              options={STATUS_FILTER_OPTIONS}
            />
          </div>
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
                <TableHead>Company</TableHead>
                <TableHead>Industry</TableHead>
                <TableHead>Target Roles</TableHead>
                <TableHead>Rounds</TableHead>
                <TableHead>Completeness</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonTableRow key={i} cols={8} />
              ))}
            </TableBody>
          </Table>
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to Load Companies"
          message={error}
          onRetry={fetchCompanies}
        />
      ) : companies.length === 0 ? (
        <EmptyState
          icon={<CompanyIcon className="w-8 h-8" />}
          title={
            hasActiveFilters
              ? "No companies match your search"
              : "No companies added yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your search query or status filter, or add a new company."
              : "The company recruitment tracks are empty. Add the first company to get started."
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
                  Add Company
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
                onClick={handleOpenCreateModal}
              >
                Add First Company
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
                    <TableHead className="min-w-[220px]">Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead className="min-w-[160px]">Target Roles</TableHead>
                    <TableHead>Rounds</TableHead>
                    <TableHead>Completeness</TableHead>
                    <TableHead>Website</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companies.map((c) => {
                    const websiteUrl = sanitizeUrl(c.website);
                    return (
                      <TableRow key={c._id}>
                        {/* Company Logo + Name + Slug */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <CompanyLogo
                              src={c.logoUrl}
                              name={c.name}
                              size="md"
                            />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-900 leading-snug truncate">
                                {c.name || "—"}
                              </p>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5 truncate">
                                /{c.slug || "—"}
                              </p>
                            </div>
                          </div>
                        </TableCell>

                        {/* Industry */}
                        <TableCell>
                          <span className="text-xs text-slate-700 font-medium">
                            {c.industry || "Technology"}
                          </span>
                        </TableCell>

                        {/* Target Roles */}
                        <TableCell>
                          {c.roles && c.roles.length > 0 ? (
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {c.roles.slice(0, 2).map((role, idx) => (
                                <Badge key={idx} variant="default" size="sm">
                                  {role}
                                </Badge>
                              ))}
                              {c.roles.length > 2 && (
                                <span className="text-[11px] text-slate-400 self-center">
                                  +{c.roles.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>

                        {/* Selection Rounds */}
                        <TableCell>
                          <span className="text-xs text-slate-700">
                            {c.selectionProcess?.length || 0} stage
                            {(c.selectionProcess?.length || 0) === 1 ? "" : "s"}
                          </span>
                        </TableCell>

                        {/* Data Completeness */}
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                              <div
                                className={`h-full ${
                                  (c.quality?.completenessPercentage ?? 0) >= 80
                                    ? "bg-emerald-500"
                                    : (c.quality?.completenessPercentage ?? 0) >= 50
                                    ? "bg-amber-500"
                                    : "bg-rose-500"
                                }`}
                                style={{
                                  width: `${c.quality?.completenessPercentage ?? 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-[11px] font-mono font-medium text-slate-600">
                              {c.quality?.completenessPercentage ?? 0}%
                            </span>
                            {c.isFeatured && (
                              <span
                                className="text-[10px] text-amber-600 font-bold ml-0.5"
                                title="Featured Track"
                              >
                                ★
                              </span>
                            )}
                          </div>
                        </TableCell>

                        {/* Website */}
                        <TableCell>
                          {websiteUrl ? (
                            <a
                              href={websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline max-w-[120px] truncate"
                              title={c.website}
                            >
                              <span>Visit</span>
                              <ExternalLinkIcon className="w-3 h-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge
                            status={c.isActive ? "active" : "inactive"}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenViewModal(c)}
                              title="View details"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(c)}
                              title="Edit company"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={togglingId === c._id}
                              onClick={() => handleRequestToggle(c)}
                              className={
                                c.isActive
                                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }
                            >
                              {c.isActive ? "Hide" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRequestDelete(c)}
                              title="Delete company"
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                            >
                              <TrashIcon className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
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
                companies
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
            {companies.map((c) => {
              const websiteUrl = sanitizeUrl(c.website);
              return (
                <div
                  key={c._id}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3"
                >
                  {/* Top row: Logo, Name, Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <CompanyLogo
                        src={c.logoUrl}
                        name={c.name}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 leading-snug truncate">
                          {c.name || "—"}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          /{c.slug || "—"}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={c.isActive ? "active" : "inactive"} />
                  </div>

                  {/* Meta row */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {c.industry || "Technology"}
                    </span>
                    <span>•</span>
                    <span>
                      {c.selectionProcess?.length || 0} stage
                      {(c.selectionProcess?.length || 0) === 1 ? "" : "s"}
                    </span>
                    <span>•</span>
                    <span>
                      Completeness:{" "}
                      <strong className="font-semibold text-slate-700">
                        {c.quality?.completenessPercentage ?? 0}%
                      </strong>
                    </span>
                    {c.isFeatured && (
                      <Badge variant="warning" size="sm" className="text-[10px]">
                        Featured
                      </Badge>
                    )}
                    {websiteUrl && (
                      <>
                        <span>•</span>
                        <a
                          href={websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-600 font-medium hover:underline"
                        >
                          <span>Website</span>
                          <ExternalLinkIcon className="w-3 h-3" />
                        </a>
                      </>
                    )}
                  </div>

                  {/* Roles */}
                  {c.roles && c.roles.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {c.roles.slice(0, 3).map((role, idx) => (
                        <Badge key={idx} variant="default" size="sm">
                          {role}
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
                      onClick={() => handleOpenViewModal(c)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEditModal(c)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${
                        c.isActive
                          ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                          : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      }`}
                      loading={togglingId === c._id}
                      onClick={() => handleRequestToggle(c)}
                    >
                      {c.isActive ? "Hide" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 px-2.5"
                      onClick={() => handleRequestDelete(c)}
                      title="Delete company"
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

      {/* ─── Create / Edit Company Modal ──────────────────────────────────── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={editingCompany ? "Edit Company Profile" : "Add New Company"}
        description="Configure company recruitment patterns, rounds, eligibility criteria, and syllabus."
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
              {editingCompany ? "Save Changes" : "Create Company"}
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

          {/* ── Section: Company Information ── */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Company Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Company Name"
                required
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g. Google"
              />
              <Input
                label="Slug"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                placeholder="google (auto-generated if empty)"
                className="font-mono text-xs"
                helperText="Auto-generated from name if left empty."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Industry"
                value={formData.industry}
                onChange={(e) => updateField("industry", e.target.value)}
                placeholder="e.g. Technology / FinTech"
              />
              <Input
                label="Logo URL"
                value={formData.logoUrl}
                onChange={(e) => updateField("logoUrl", e.target.value)}
                placeholder="https://example.com/logo.png"
                helperText="Leave empty to use automatic initials avatar."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Website URL"
                value={formData.website}
                onChange={(e) => updateField("website", e.target.value)}
                placeholder="https://example.com"
              />
              <Input
                label="Careers Page URL"
                value={formData.careersUrl}
                onChange={(e) => updateField("careersUrl", e.target.value)}
                placeholder="https://example.com/careers"
              />
            </div>

            <Textarea
              label="Company Overview"
              rows={3}
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief description of the organization and work culture…"
            />
          </div>

          {/* ── Section: Placement Specifications ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Placement Specifications
            </h4>
            <Input
              label="Target Roles (comma separated)"
              value={formData.roles}
              onChange={(e) => updateField("roles", e.target.value)}
              placeholder="e.g. Software Engineer, Systems Engineer, Analyst"
            />
            <Textarea
              label="Eligibility Criteria"
              rows={2}
              value={formData.eligibility}
              onChange={(e) => updateField("eligibility", e.target.value)}
              placeholder="e.g. B.E. / B.Tech / MCA with minimum 65% aggregate and no active backlogs."
            />
            <Textarea
              label="Hiring Rounds / Selection Process (one per line)"
              rows={3}
              value={formData.selectionProcess}
              onChange={(e) => updateField("selectionProcess", e.target.value)}
              placeholder="Online Assessment&#10;Technical Round 1&#10;Technical Round 2&#10;HR Interview"
              helperText="Enter each recruitment stage on a new line."
              className="font-mono text-xs"
            />
          </div>

          {/* ── Section: Structured Eligibility Criteria (Phase 39) ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Structured Eligibility Criteria (For Student Match Engine)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="Minimum CGPA (0 - 10)"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.minCgpa}
                onChange={(e) => updateField("minCgpa", e.target.value)}
                placeholder="e.g. 7.0"
                helperText="Leave blank if no minimum CGPA requirement."
              />
              <Input
                label="Maximum Active Backlogs Allowed"
                type="number"
                min="0"
                value={formData.maxBacklogs}
                onChange={(e) => updateField("maxBacklogs", e.target.value)}
                placeholder="e.g. 0"
                helperText="Leave blank if backlogs are not evaluated."
              />
            </div>
            <Input
              label="Allowed Branches (comma separated)"
              value={formData.allowedBranches}
              onChange={(e) => updateField("allowedBranches", e.target.value)}
              placeholder="e.g. Computer Science, Information Technology, Electronics"
              helperText="Leave blank if open to all branches."
            />
            <Input
              label="Allowed Graduation Years (comma separated)"
              value={formData.allowedGraduationYears}
              onChange={(e) =>
                updateField("allowedGraduationYears", e.target.value)
              }
              placeholder="e.g. 2025, 2026"
              helperText="Leave blank if open to all passing-out batches."
            />
          </div>

          {/* ── Section: Syllabus & Preparation Topics ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Preparation Syllabus & Topics
            </h4>
            <Input
              label="Aptitude Topics (comma separated)"
              value={formData.aptitudeTopics}
              onChange={(e) => updateField("aptitudeTopics", e.target.value)}
              placeholder="Quantitative Aptitude, Logical Reasoning, Verbal"
            />
            <Input
              label="Coding Topics (comma separated)"
              value={formData.codingTopics}
              onChange={(e) => updateField("codingTopics", e.target.value)}
              placeholder="Data Structures, Dynamic Programming, Graphs"
            />
            <Input
              label="Interview Topics (comma separated)"
              value={formData.interviewTopics}
              onChange={(e) => updateField("interviewTopics", e.target.value)}
              placeholder="System Design, DBMS, OOP Concepts, HR Questions"
            />
          </div>

          {/* ── Section: Status & Visibility ── */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
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
                Active — visible to students on the company preparation tracks
              </label>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="form-featured-toggle"
                checked={formData.isFeatured}
                onChange={(e) => updateField("isFeatured", e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 border-slate-300"
              />
              <label
                htmlFor="form-featured-toggle"
                className="text-xs font-medium text-slate-700 cursor-pointer select-none"
              >
                Featured Track — highlight and prioritize in student directory
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── View Company Detail Modal ────────────────────────────────────── */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewCompany(null);
        }}
        title={viewCompany?.name || "Company Overview"}
        description={
          viewCompany
            ? `${viewCompany.industry || "Technology"} • /${viewCompany.slug || ""}`
            : ""
        }
        maxWidth="max-w-2xl"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsViewModalOpen(false);
                setViewCompany(null);
              }}
            >
              Close
            </Button>
            {viewCompany && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<EditIcon className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(viewCompany);
                }}
              >
                Edit Company
              </Button>
            )}
          </>
        }
      >
        {viewCompany && (
          <div className="space-y-5">
            {/* Header: Logo, Name, Industry, Status */}
            <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl">
              <CompanyLogo
                src={viewCompany.logoUrl}
                name={viewCompany.name}
                size="lg"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-base font-bold text-slate-900 leading-snug">
                    {viewCompany.name}
                  </h4>
                  <StatusBadge
                    status={viewCompany.isActive ? "active" : "inactive"}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  {viewCompany.industry || "Technology"} • /{viewCompany.slug}
                </p>

                {/* External links */}
                <div className="flex items-center gap-3 mt-2 text-xs">
                  {sanitizeUrl(viewCompany.website) && (
                    <a
                      href={sanitizeUrl(viewCompany.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      <span>Official Website</span>
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  )}
                  {sanitizeUrl(viewCompany.careersUrl) && (
                    <a
                      href={sanitizeUrl(viewCompany.careersUrl)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium hover:underline"
                    >
                      <span>Careers Portal</span>
                      <ExternalLinkIcon className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {viewCompany.description && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  About
                </h5>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {viewCompany.description}
                </p>
              </div>
            )}

            {/* Target Roles */}
            {viewCompany.roles && viewCompany.roles.length > 0 && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Target Roles
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {viewCompany.roles.map((role, idx) => (
                    <Badge key={idx} variant="default" size="sm">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Eligibility */}
            {viewCompany.eligibility && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Eligibility Criteria (Description)
                </h5>
                <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {viewCompany.eligibility}
                </p>
              </div>
            )}

            {/* Structured Eligibility Criteria */}
            {viewCompany.eligibilityCriteria && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Structured Match Criteria
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Min CGPA
                    </span>
                    <span className="font-semibold text-slate-800">
                      {viewCompany.eligibilityCriteria.minCgpa ?? "None"}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Max Backlogs
                    </span>
                    <span className="font-semibold text-slate-800">
                      {viewCompany.eligibilityCriteria.maxBacklogs ?? "None"}
                    </span>
                  </div>
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded-lg sm:col-span-2">
                    <span className="text-[10px] text-slate-400 block uppercase font-medium">
                      Eligible Batches
                    </span>
                    <span className="font-semibold text-slate-800">
                      {viewCompany.eligibilityCriteria.allowedGraduationYears?.length
                        ? viewCompany.eligibilityCriteria.allowedGraduationYears.join(
                            ", "
                          )
                        : "All batches"}
                    </span>
                  </div>
                </div>
                {viewCompany.eligibilityCriteria.allowedBranches?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {viewCompany.eligibilityCriteria.allowedBranches.map(
                      (b, i) => (
                        <Badge key={i} variant="default" size="sm">
                          {b}
                        </Badge>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selection Process */}
            {viewCompany.selectionProcess &&
              viewCompany.selectionProcess.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                    Selection Process ({viewCompany.selectionProcess.length} Rounds)
                  </h5>
                  <div className="space-y-1.5">
                    {viewCompany.selectionProcess.map((round, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 font-medium"
                      >
                        <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                          {idx + 1}
                        </span>
                        <span>{round}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            {/* Syllabus Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {viewCompany.aptitudeTopics &&
                viewCompany.aptitudeTopics.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Aptitude Topics
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {viewCompany.aptitudeTopics.map((topic, idx) => (
                        <Badge key={idx} variant="default" size="sm">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

              {viewCompany.codingTopics &&
                viewCompany.codingTopics.length > 0 && (
                  <div>
                    <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Coding Topics
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {viewCompany.codingTopics.map((topic, idx) => (
                        <Badge key={idx} variant="default" size="sm">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {/* Interview Topics */}
            {viewCompany.interviewTopics &&
              viewCompany.interviewTopics.length > 0 && (
                <div>
                  <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Interview Topics
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {viewCompany.interviewTopics.map((topic, idx) => (
                      <Badge key={idx} variant="info" size="sm">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

            {/* Resources (if any exist in backend) */}
            {viewCompany.resources && viewCompany.resources.length > 0 && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Resources
                </h5>
                <div className="space-y-1.5">
                  {viewCompany.resources.map((res, idx) => (
                    <a
                      key={idx}
                      href={sanitizeUrl(res.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 transition-colors"
                    >
                      <span className="font-medium text-slate-800">
                        {res.title || "Resource Link"}
                      </span>
                      <ExternalLinkIcon className="w-3.5 h-3.5" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              {viewCompany.createdAt && (
                <span>Added: {formatDate(viewCompany.createdAt)}</span>
              )}
              {viewCompany.updatedAt && (
                <span>Last updated: {formatDate(viewCompany.updatedAt)}</span>
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
            ? "Hide Company Track?"
            : "Activate Company Track?"
        }
        description={
          toggleTarget?.isActive
            ? "This company profile and syllabus will be hidden from the student company preparation module."
            : "This company profile will become visible to all students preparing for placements."
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
              {toggleTarget?.isActive ? "Hide Company" : "Activate Company"}
            </Button>
          </>
        }
      >
        {toggleTarget && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
            <CompanyLogo
              src={toggleTarget.logoUrl}
              name={toggleTarget.name}
              size="md"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {toggleTarget.name || "—"}
              </p>
              <p className="text-xs text-slate-500">
                {toggleTarget.industry || "Technology"} • /{toggleTarget.slug}
              </p>
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
        title="Delete Company Profile?"
        description="Are you sure you want to delete this company profile? If students are targeting this company in their goals, it will be deactivated to preserve student preparation plans."
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
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
            <CompanyLogo
              src={deleteTarget.logoUrl}
              name={deleteTarget.name}
              size="md"
            />
            <div>
              <p className="text-sm font-semibold text-slate-900">
                {deleteTarget.name || "—"}
              </p>
              <p className="text-xs text-slate-500">
                {deleteTarget.industry || "Technology"} • /{deleteTarget.slug}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
