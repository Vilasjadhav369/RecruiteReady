import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  getAdminResources,
  createResource,
  getAdminResourceById,
  updateResource,
  updateResourceStatus,
  deleteResource,
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
  ResourcesIcon,
  PlusIcon,
  EditIcon,
  EyeIcon,
  ExternalLinkIcon,
  DocumentIcon,
  TrashIcon,
} from "../../components/ui/Icons.jsx";

// ─── Constants ────────────────────────────────────────────────────────────────

const RESOURCE_TYPE_LABELS = {
  pdf: "PDF",
  video: "Video",
  article: "Article",
  link: "Link",
  note: "Note",
};

const TYPE_FILTER_OPTIONS = [
  { value: "", label: "All Formats" },
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
  { value: "link", label: "Link" },
  { value: "note", label: "Note" },
];

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "active", label: "Active Only" },
  { value: "inactive", label: "Inactive Only" },
];

const FORM_TYPE_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
  { value: "link", label: "Link" },
  { value: "note", label: "Note" },
];

const CATEGORIES = [
  "Aptitude",
  "Data Structures",
  "Algorithms",
  "Core CS",
  "Interview Prep",
  "System Design",
];

const FORM_CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: c }));

const INITIAL_FORM_STATE = {
  title: "",
  description: "",
  type: "article",
  category: "Aptitude",
  topic: "",
  url: "",
  fileUrl: "",
  thumbnailUrl: "",
  isActive: true,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const safeNumber = (val) => {
  if (val === null || val === undefined) return 0;
  if (typeof val === "object") return Number(val.total ?? val.count ?? 0) || 0;
  return Number(val) || 0;
};

const getTypeVariant = (type) => {
  switch (type) {
    case "pdf":
      return "danger";
    case "video":
      return "primary";
    case "article":
      return "info";
    case "note":
      return "warning";
    case "link":
      return "default";
    default:
      return "default";
  }
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

// ─── Component ────────────────────────────────────────────────────────────────

export default function AdminResourcesPage() {
  // ── Data State ──
  const [resources, setResources] = useState([]);
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
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const searchTimerRef = useRef(null);

  // ── Create / Edit Modal ──
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // ── View Detail Modal ──
  const [viewResource, setViewResource] = useState(null);
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

  // ── Fetch Resources ──
  const fetchResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = { page: pagination.page, limit: pagination.limit };
      if (debouncedSearch) params.search = debouncedSearch;
      if (typeFilter) params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const data = await getAdminResources(params);
      setResources(data?.resources || []);
      setPagination(
        data?.pagination || { total: 0, page: 1, limit: 10, pages: 1 }
      );
    } catch (err) {
      console.error("Fetch resources error:", err);
      setError(
        err.response?.data?.message || "Failed to load study materials."
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, typeFilter, statusFilter, pagination.page, pagination.limit]);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // ── Filter Handlers ──
  const handleTypeChange = (e) => {
    setTypeFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };
  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination((p) => ({ ...p, page: 1 }));
  };

  const hasActiveFilters =
    debouncedSearch || typeFilter || statusFilter !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setTypeFilter("");
    setStatusFilter("all");
    setPagination((p) => ({ ...p, page: 1 }));
  };

  // ── Form Field Updater ──
  const updateField = (field, value) =>
    setFormData((prev) => ({ ...prev, [field]: value }));

  // ── Create Modal ──
  const handleOpenCreateModal = () => {
    setEditingResource(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
    setIsFormModalOpen(true);
  };

  // ── Edit Modal ──
  const handleOpenEditModal = (res) => {
    setEditingResource(res);
    setFormData({
      title: res.title || "",
      description: res.description || "",
      type: res.type || "article",
      category: res.category || "Aptitude",
      topic: res.topic || "",
      url: res.url || "",
      fileUrl: res.fileUrl || "",
      thumbnailUrl: res.thumbnailUrl || "",
      isActive: res.isActive ?? true,
    });
    setFormError(null);
    setIsFormModalOpen(true);
  };

  const handleCloseFormModal = () => {
    setIsFormModalOpen(false);
    setEditingResource(null);
    setFormData(INITIAL_FORM_STATE);
    setFormError(null);
  };

  // ── View Detail Modal ──
  const handleOpenViewModal = async (resource) => {
    setIsViewModalOpen(true);
    setViewResource(resource);
    try {
      const full = await getAdminResourceById(resource._id);
      if (full) setViewResource(full);
    } catch (err) {
      console.error("Failed to load resource detail:", err);
    }
  };

  // ── Form Submit ──
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.title.trim()) {
      setFormError("Resource title is required.");
      return;
    }
    if (!formData.topic.trim()) {
      setFormError("Topic is required.");
      return;
    }
    if (!formData.url.trim()) {
      setFormError("Resource URL is required.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      type: formData.type,
      category: formData.category,
      topic: formData.topic.trim(),
      url: formData.url.trim(),
      fileUrl: formData.fileUrl.trim(),
      thumbnailUrl: formData.thumbnailUrl.trim(),
      isActive: formData.isActive,
    };

    try {
      setFormSubmitting(true);
      if (editingResource) {
        await updateResource(editingResource._id, payload);
        showToast(
          "success",
          "Resource Updated",
          "Study material saved successfully."
        );
      } else {
        await createResource(payload);
        showToast(
          "success",
          "Resource Created",
          "New study material added to the library."
        );
      }
      handleCloseFormModal();
      fetchResources();
    } catch (err) {
      console.error("Save resource error:", err);
      setFormError(
        err.response?.data?.message || "Failed to save resource. Please check fields."
      );
    } finally {
      setFormSubmitting(false);
    }
  };

  // ── Status Toggle ──
  const handleRequestToggle = (resource) => {
    setToggleTarget(resource);
    setIsToggleModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!toggleTarget) return;
    const r = toggleTarget;
    try {
      setTogglingId(r._id);
      setIsToggleModalOpen(false);
      const newStatus = !r.isActive;
      const updated = await updateResourceStatus(r._id, newStatus);
      setResources((prev) =>
        prev.map((item) =>
          item._id === r._id
            ? { ...item, isActive: updated?.isActive ?? newStatus }
            : item
        )
      );
      showToast(
        "success",
        "Status Updated",
        `"${r.title}" is now ${newStatus ? "Active" : "Inactive"}.`
      );
    } catch (err) {
      console.error("Toggle status error:", err);
      showToast(
        "error",
        "Update Failed",
        "Could not update resource status. Please try again."
      );
    } finally {
      setTogglingId(null);
      setToggleTarget(null);
    }
  };

  // ── Delete Study Resource ──
  const handleRequestDelete = (resource) => {
    setDeleteTarget(resource);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await deleteResource(deleteTarget._id);
      showToast(
        "success",
        "Resource Deleted",
        "Study material permanently removed from library."
      );
      setIsDeleteModalOpen(false);
      setDeleteTarget(null);
      fetchResources();
    } catch (err) {
      console.error("Error deleting resource:", err);
      showToast(
        "error",
        "Delete Failed",
        err.response?.data?.message || "Failed to delete study material."
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
        title="Study Materials"
        description="Manage learning resources and preparation materials for student access."
        badge={
          !loading && (
            <Badge variant="primary" size="sm">
              {safeNumber(pagination.total)} Resources
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
            Add Resource
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
            value={typeFilter}
            onChange={handleTypeChange}
            options={TYPE_FILTER_OPTIONS}
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
                <TableHead>Resource</TableHead>
                <TableHead>Format</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Topic</TableHead>
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
          title="Unable to Load Study Materials"
          message={error}
          onRetry={fetchResources}
        />
      ) : resources.length === 0 ? (
        <EmptyState
          icon={<ResourcesIcon className="w-8 h-8" />}
          title={
            hasActiveFilters
              ? "No resources match your filters"
              : "No study materials added yet"
          }
          description={
            hasActiveFilters
              ? "Try adjusting your search or filter criteria, or add a new resource."
              : "The resource library is empty. Add the first study material to get started."
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
                  Add Resource
                </Button>
              </div>
            ) : (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<PlusIcon className="w-3.5 h-3.5" />}
                onClick={handleOpenCreateModal}
              >
                Add First Resource
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
                    <TableHead className="min-w-[260px]">Resource</TableHead>
                    <TableHead>Format</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((res) => {
                    const resourceUrl = sanitizeUrl(res.url);
                    return (
                      <TableRow key={res._id}>
                        {/* Resource Title + URL */}
                        <TableCell>
                          <div className="max-w-sm">
                            <p className="text-sm font-medium text-slate-900 leading-snug">
                              {res.title || "—"}
                            </p>
                            {resourceUrl && (
                              <a
                                href={resourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-mono mt-0.5 max-w-[240px] truncate"
                                title={res.url}
                              >
                                <span className="truncate">{res.url}</span>
                                <ExternalLinkIcon className="w-2.5 h-2.5 shrink-0" />
                              </a>
                            )}
                          </div>
                        </TableCell>

                        {/* Format / Type */}
                        <TableCell>
                          <Badge variant={getTypeVariant(res.type)} size="sm">
                            {RESOURCE_TYPE_LABELS[res.type] ||
                              (res.type || "—").toUpperCase()}
                          </Badge>
                        </TableCell>

                        {/* Category */}
                        <TableCell>
                          <span className="text-xs text-slate-700">
                            {res.category || "—"}
                          </span>
                        </TableCell>

                        {/* Topic */}
                        <TableCell>
                          <span className="text-xs text-slate-600">
                            {res.topic || "—"}
                          </span>
                        </TableCell>

                        {/* Status */}
                        <TableCell>
                          <StatusBadge
                            status={res.isActive ? "active" : "inactive"}
                          />
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenViewModal(res)}
                              title="View details"
                            >
                              <EyeIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditModal(res)}
                              title="Edit resource"
                            >
                              <EditIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              loading={togglingId === res._id}
                              onClick={() => handleRequestToggle(res)}
                              className={
                                res.isActive
                                  ? "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                              }
                            >
                              {res.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRequestDelete(res)}
                              title="Delete resource"
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
                resources
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
            {resources.map((res) => {
              const resourceUrl = sanitizeUrl(res.url);
              return (
                <div
                  key={res._id}
                  className="bg-white border border-slate-200/80 rounded-xl p-4 space-y-3"
                >
                  {/* Top row: type + status */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant={getTypeVariant(res.type)} size="sm">
                      {RESOURCE_TYPE_LABELS[res.type] ||
                        (res.type || "—").toUpperCase()}
                    </Badge>
                    <StatusBadge
                      status={res.isActive ? "active" : "inactive"}
                    />
                  </div>

                  {/* Title */}
                  <div>
                    <p className="text-sm font-medium text-slate-900 leading-snug">
                      {res.title || "—"}
                    </p>
                    {resourceUrl && (
                      <a
                        href={resourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-blue-600 font-mono mt-0.5 truncate max-w-full"
                      >
                        <span className="truncate">{res.url}</span>
                        <ExternalLinkIcon className="w-2.5 h-2.5 shrink-0" />
                      </a>
                    )}
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">
                      {res.category || "—"}
                    </span>
                    {res.topic && (
                      <>
                        <span>•</span>
                        <span>{res.topic}</span>
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenViewModal(res)}
                    >
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEditModal(res)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`flex-1 ${
                        res.isActive
                          ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                          : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                      }`}
                      loading={togglingId === res._id}
                      onClick={() => handleRequestToggle(res)}
                    >
                      {res.isActive ? "Deactivate" : "Activate"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 px-2.5"
                      onClick={() => handleRequestDelete(res)}
                      title="Delete resource"
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

      {/* ─── Create / Edit Resource Modal ─────────────────────────────────── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={handleCloseFormModal}
        title={
          editingResource ? "Edit Study Material" : "Add New Study Material"
        }
        description="Configure resource details, classification, and external link."
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
              {editingResource ? "Save Changes" : "Create Resource"}
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

          {/* ── Section: Resource Information ── */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Resource Information
            </h4>
            <Input
              label="Title"
              required
              value={formData.title}
              onChange={(e) => updateField("title", e.target.value)}
              placeholder="e.g. Quantitative Aptitude Quick Reference Guide"
            />
            <Textarea
              label="Description"
              rows={3}
              value={formData.description}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Brief summary of what this resource covers…"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Select
                label="Format Type"
                value={formData.type}
                onChange={(e) => updateField("type", e.target.value)}
                options={FORM_TYPE_OPTIONS}
              />
              <Select
                label="Category"
                value={formData.category}
                onChange={(e) => updateField("category", e.target.value)}
                options={FORM_CATEGORY_OPTIONS}
              />
            </div>
            <Input
              label="Topic"
              required
              value={formData.topic}
              onChange={(e) => updateField("topic", e.target.value)}
              placeholder="e.g. Dynamic Programming, Speed Math, OS Concepts"
            />
          </div>

          {/* ── Section: Resource Location ── */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider pt-1">
              Resource Location
            </h4>
            <Input
              label="Resource URL"
              required
              type="url"
              value={formData.url}
              onChange={(e) => updateField("url", e.target.value)}
              placeholder="https://..."
              className="font-mono text-xs"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                label="File URL"
                value={formData.fileUrl}
                onChange={(e) => updateField("fileUrl", e.target.value)}
                placeholder="Direct file link (optional)"
                helperText="If a direct download link is available."
                className="font-mono text-xs"
              />
              <Input
                label="Thumbnail URL"
                value={formData.thumbnailUrl}
                onChange={(e) => updateField("thumbnailUrl", e.target.value)}
                placeholder="Preview image URL (optional)"
                helperText="Optional preview image for the resource."
                className="font-mono text-xs"
              />
            </div>
          </div>

          {/* ── Section: Status ── */}
          <div className="pt-2 border-t border-slate-100">
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
                Active — visible to students in the resource library
              </label>
            </div>
          </div>
        </form>
      </Modal>

      {/* ─── View Resource Detail Modal ───────────────────────────────────── */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setViewResource(null);
        }}
        title={viewResource?.title || "Resource Details"}
        description={
          viewResource
            ? `${viewResource.category || "—"} • ${viewResource.topic || "—"}`
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
                setViewResource(null);
              }}
            >
              Close
            </Button>
            {viewResource && (
              <Button
                variant="primary"
                size="sm"
                iconLeft={<EditIcon className="w-3.5 h-3.5" />}
                onClick={() => {
                  setIsViewModalOpen(false);
                  handleOpenEditModal(viewResource);
                }}
              >
                Edit Resource
              </Button>
            )}
          </>
        }
      >
        {viewResource && (
          <div className="space-y-5">
            {/* Meta Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={getTypeVariant(viewResource.type)}
                size="sm"
              >
                {RESOURCE_TYPE_LABELS[viewResource.type] ||
                  (viewResource.type || "—").toUpperCase()}
              </Badge>
              <StatusBadge
                status={viewResource.isActive ? "active" : "inactive"}
              />
              <span className="text-xs text-slate-500">
                {viewResource.category || "—"}
              </span>
            </div>

            {/* Description */}
            {viewResource.description && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Description
                </h5>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap">
                  {viewResource.description}
                </p>
              </div>
            )}

            {/* Topic */}
            <div>
              <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Topic
              </h5>
              <Badge variant="default" size="sm">
                {viewResource.topic || "—"}
              </Badge>
            </div>

            {/* Resource URL */}
            {viewResource.url && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Resource URL
                </h5>
                <a
                  href={sanitizeUrl(viewResource.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-mono bg-blue-50/50 px-3 py-2 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors max-w-full"
                >
                  <span className="truncate">{viewResource.url}</span>
                  <ExternalLinkIcon className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            )}

            {/* File URL */}
            {viewResource.fileUrl && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Direct File Link
                </h5>
                <a
                  href={sanitizeUrl(viewResource.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-mono bg-slate-50 px-3 py-2 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors max-w-full"
                >
                  <DocumentIcon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{viewResource.fileUrl}</span>
                  <ExternalLinkIcon className="w-3 h-3 shrink-0" />
                </a>
              </div>
            )}

            {/* Thumbnail Preview */}
            {viewResource.thumbnailUrl && (
              <div>
                <h5 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                  Thumbnail Preview
                </h5>
                <div className="w-full max-w-xs">
                  <img
                    src={viewResource.thumbnailUrl}
                    alt={`Thumbnail for ${viewResource.title}`}
                    className="rounded-lg border border-slate-200 object-cover max-h-40 w-auto"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                  <p className="text-[11px] text-slate-400 font-mono mt-1 truncate">
                    {viewResource.thumbnailUrl}
                  </p>
                </div>
              </div>
            )}

            {/* Timestamps */}
            <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-100">
              {viewResource.createdAt && (
                <span>Added: {formatDate(viewResource.createdAt)}</span>
              )}
              {viewResource.updatedAt && (
                <span>Updated: {formatDate(viewResource.updatedAt)}</span>
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
            ? "Deactivate Resource?"
            : "Activate Resource?"
        }
        description={
          toggleTarget?.isActive
            ? "This study material will be hidden from the student resource library."
            : "This study material will become visible in the student resource library."
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
            <div className="flex items-center gap-2.5">
              <Badge
                variant={getTypeVariant(toggleTarget.type)}
                size="sm"
              >
                {RESOURCE_TYPE_LABELS[toggleTarget.type] ||
                  (toggleTarget.type || "—").toUpperCase()}
              </Badge>
              <p className="text-sm font-medium text-slate-900">
                {toggleTarget.title || "—"}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {toggleTarget.category || "—"} • {toggleTarget.topic || "—"}
            </p>
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
        title="Delete Study Material?"
        description="Are you sure you want to permanently delete this study material from the platform?"
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
            <div className="flex items-center gap-2.5">
              <Badge
                variant={getTypeVariant(deleteTarget.type)}
                size="sm"
              >
                {RESOURCE_TYPE_LABELS[deleteTarget.type] ||
                  (deleteTarget.type || "—").toUpperCase()}
              </Badge>
              <p className="text-sm font-medium text-slate-900">
                {deleteTarget.title || "—"}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {deleteTarget.category || "—"} • {deleteTarget.topic || "—"}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}
