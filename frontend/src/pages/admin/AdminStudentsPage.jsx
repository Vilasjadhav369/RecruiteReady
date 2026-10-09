import { useState, useEffect, useCallback } from "react";
import {
  getStudents,
  getStudentById,
  updateStudentStatus,
  bulkUpdateStudentStatus,
  downloadStudentsCsv,
} from "../../services/adminService.js";
import {
  PageHeader,
  Card,
  CardTitle,
  CardContent,
  Button,
  Badge,
  StatusBadge,
  SearchInput,
  Select,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Modal,
  Avatar,
  Skeleton,
  EmptyState,
  ErrorState,
  Toast,
} from "../../components/ui/index.js";
import {
  ProfileIcon,
  SearchIcon,
  CheckCircleIcon,
  RefreshIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  CompanyIcon,
  ShieldCheckIcon,
  DocumentIcon,
  CloseIcon,
} from "../../components/ui/Icons.jsx";

/**
 * Format ISO dates for professional display
 */
function formatDate(dateString) {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

/**
 * AdminStudentsPage — Candidate management, credential inspection, bulk actions, and CSV export.
 * Direction: Apple + Linear + Premium University
 * Strictly operates on real MongoDB records with server pagination and filtering.
 */
function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [graduationYearFilter, setGraduationYearFilter] = useState("all");
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState("all");

  // Sorting state
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Filter options from API
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableGraduationYears, setAvailableGraduationYears] = useState([]);

  // Bulk Selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkConfirmModal, setBulkConfirmModal] = useState({
    isOpen: false,
    action: null, // 'activate' | 'deactivate'
  });
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Loading & Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportingCsv, setExportingCsv] = useState(false);

  // Student Detail Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status Confirmation Modal state (Single student)
  const [statusTargetStudent, setStatusTargetStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  // Fetch paginated student list from backend API
  const fetchStudentsList = useCallback(
    async (pageToLoad = 1) => {
      setLoading(true);
      setError(null);

      try {
        const data = await getStudents({
          search: activeSearch,
          status: statusFilter,
          branch: branchFilter,
          graduationYear: graduationYearFilter,
          emailVerified: emailVerifiedFilter,
          sortBy,
          sortOrder,
          page: pageToLoad,
          limit: 10,
        });

        setStudents(Array.isArray(data?.students) ? data.students : []);
        setPagination({
          page: data?.pagination?.page || pageToLoad,
          limit: data?.pagination?.limit || 10,
          total: data?.pagination?.total || 0,
          pages: data?.pagination?.pages || 1,
        });

        if (Array.isArray(data?.filters?.availableBranches)) {
          setAvailableBranches(data.filters.availableBranches);
        }
        if (Array.isArray(data?.filters?.availableGraduationYears)) {
          setAvailableGraduationYears(data.filters.availableGraduationYears);
        }
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Unable to load student directory. Please verify server connectivity.");
      } finally {
        setLoading(false);
      }
    },
    [
      activeSearch,
      statusFilter,
      branchFilter,
      graduationYearFilter,
      emailVerifiedFilter,
      sortBy,
      sortOrder,
    ]
  );

  // Debounce search changes by 350ms to prevent request flooding
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Refetch when filters or sorting change (reset to page 1)
  useEffect(() => {
    fetchStudentsList(1);
    setSelectedIds([]); // Clear selection when criteria change
  }, [fetchStudentsList]);

  // Load detailed student data when inspection modal is opened
  const handleOpenDetail = async (student) => {
    setSelectedStudent(student);
    setDetailLoading(true);
    try {
      const fullStudent = await getStudentById(student._id);
      if (fullStudent) {
        setSelectedStudent(fullStudent);
      }
    } catch (err) {
      console.warn("Could not load extended student details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Execute single student account status toggle with confirmation
  const handleConfirmStatusChange = async () => {
    if (!statusTargetStudent) return;
    const target = statusTargetStudent;
    const nextStatus = !target.isActive;

    setActionLoading(true);
    try {
      const updated = await updateStudentStatus(target._id, nextStatus);

      // Update student in local list
      setStudents((prev) =>
        prev.map((s) => (s._id === target._id ? { ...s, isActive: updated.isActive } : s))
      );

      // Update selected student if modal is open
      if (selectedStudent && selectedStudent._id === target._id) {
        setSelectedStudent((prev) => ({ ...prev, isActive: updated.isActive }));
      }

      setToast({
        variant: "success",
        title: "Account Status Updated",
        message: `${target.firstName} ${target.lastName} has been ${
          nextStatus ? "activated" : "deactivated"
        }.`,
      });

      setStatusTargetStudent(null);
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update student status.";
      setToast({
        variant: "error",
        title: "Action Failed",
        message: msg,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk Selection Handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = students.map((s) => s._id);
      setSelectedIds(Array.from(new Set([...selectedIds, ...pageIds])));
    } else {
      const pageIds = new Set(students.map((s) => s._id));
      setSelectedIds(selectedIds.filter((id) => !pageIds.has(id)));
    }
  };

  const handleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const isAllOnPageSelected =
    students.length > 0 && students.every((s) => selectedIds.includes(s._id));

  // Bulk Status Update Execution
  const handleExecuteBulkStatus = async () => {
    if (!bulkConfirmModal.action || selectedIds.length === 0) return;
    const isActive = bulkConfirmModal.action === "activate";

    setBulkActionLoading(true);
    try {
      const res = await bulkUpdateStudentStatus(selectedIds, isActive);
      setToast({
        variant: "success",
        title: "Bulk Update Succeeded",
        message: res.message || `Updated ${selectedIds.length} student(s) successfully.`,
      });
      setBulkConfirmModal({ isOpen: false, action: null });
      setSelectedIds([]);
      fetchStudentsList(pagination.page);
    } catch (err) {
      setToast({
        variant: "error",
        title: "Bulk Action Failed",
        message: err.response?.data?.message || "Failed to execute bulk status update.",
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  // Safe CSV Export Handler
  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await downloadStudentsCsv({
        search: activeSearch,
        status: statusFilter,
        branch: branchFilter,
        graduationYear: graduationYearFilter,
        emailVerified: emailVerifiedFilter,
      });
      setToast({
        variant: "success",
        title: "CSV Export Complete",
        message: "Candidate directory safely exported without credentials or tokens.",
      });
    } catch (err) {
      setToast({
        variant: "error",
        title: "Export Failed",
        message: err.response?.data?.message || "Unable to generate CSV export file.",
      });
    } finally {
      setExportingCsv(false);
    }
  };

  // Quick reset for all applied filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveSearch("");
    setStatusFilter("all");
    setBranchFilter("all");
    setGraduationYearFilter("all");
    setEmailVerifiedFilter("all");
    setSortBy("createdAt");
    setSortOrder("desc");
  };

  const hasActiveFilters = Boolean(
    activeSearch ||
      statusFilter !== "all" ||
      branchFilter !== "all" ||
      graduationYearFilter !== "all" ||
      emailVerifiedFilter !== "all" ||
      sortBy !== "createdAt"
  );

  // Summary counts
  const pageRangeStart = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const pageRangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. Page Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Students"
        description="Inspect registered candidate profiles, verify academic credentials, perform bulk actions, and export reports."
        breadcrumbs={[
          { label: "Admin Console", href: "/admin" },
          { label: "Students" },
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              loading={exportingCsv}
              iconLeft={<DocumentIcon className="w-3.5 h-3.5" />}
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchStudentsList(pagination.page)}
              iconLeft={<RefreshIcon className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <div className="hidden sm:inline-flex items-center px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700">
              Total Candidates: <span className="ml-1 text-slate-900 font-mono">{pagination.total}</span>
            </div>
          </div>
        }
      />

      {/* ── Toast Notification ──────────────────────────────────────── */}
      {toast && (
        <Toast
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* ── 2. Metric Overview Strip ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
            Total Candidates
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono mt-1 block">
            {pagination.total.toLocaleString()}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Registered records</span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
            Filter Scope
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight capitalize mt-1 block">
            {statusFilter}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {statusFilter === "all" ? "Showing all statuses" : `Filtered by ${statusFilter}`}
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
            Current Page
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono mt-1 block">
            {pagination.page} / {pagination.pages}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {pageRangeStart}–{pageRangeEnd} displayed
          </span>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold uppercase text-slate-500 tracking-wider block">
            Page Capacity
          </span>
          <span className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight font-mono mt-1 block">
            {pagination.limit}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">Items per page</span>
        </div>
      </div>

      {/* ── 3. Search & Enhanced Filters Control Bar ─────────────────────────── */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <SearchInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onClear={() => setSearchTerm("")}
                placeholder="Search name, email, college..."
                size="md"
              />
            </div>

            {/* Branch Filter */}
            <Select
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
            >
              <option value="all">All Branches</option>
              {availableBranches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>

            {/* Graduation Year Filter */}
            <Select
              value={graduationYearFilter}
              onChange={(e) => setGraduationYearFilter(e.target.value)}
            >
              <option value="all">All Grad Years</option>
              {availableGraduationYears.map((yr) => (
                <option key={yr} value={yr}>
                  Class of {yr}
                </option>
              ))}
            </Select>

            {/* Email Verified Filter */}
            <Select
              value={emailVerifiedFilter}
              onChange={(e) => setEmailVerifiedFilter(e.target.value)}
            >
              <option value="all">Email Status (All)</option>
              <option value="true">Verified</option>
              <option value="false">Unverified</option>
            </Select>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
            {/* Status Segmented Filter */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/80">
              {[
                { value: "all", label: "All Candidates" },
                { value: "active", label: "Active Only" },
                { value: "inactive", label: "Inactive Only" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStatusFilter(opt.value)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === opt.value
                      ? "bg-white text-slate-900 shadow-2xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown & Reset */}
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <span className="text-xs text-slate-400 whitespace-nowrap">Sort by:</span>
              <Select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split("-");
                  setSortBy(field);
                  setSortOrder(order);
                }}
                className="w-40 text-xs"
              >
                <option value="createdAt-desc">Newest First</option>
                <option value="createdAt-asc">Oldest First</option>
                <option value="firstName-asc">Name (A-Z)</option>
                <option value="firstName-desc">Name (Z-A)</option>
                <option value="graduationYear-desc">Grad Year (High-Low)</option>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="text-slate-500 hover:text-slate-900"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── 4. Bulk Action Floating / Sticky Bar ─────────────────────── */}
      {selectedIds.length > 0 && (
        <div className="sticky top-4 z-20 bg-slate-900 text-white rounded-xl p-3 px-4 shadow-xl flex items-center justify-between gap-4 border border-slate-800 transition-all">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-semibold font-mono">
              {selectedIds.length} candidate(s) selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-800 text-slate-100 border-slate-700 hover:bg-slate-700"
              onClick={() => setBulkConfirmModal({ isOpen: true, action: "activate" })}
            >
              Activate Selected
            </Button>

            <Button
              variant="danger"
              size="sm"
              onClick={() => setBulkConfirmModal({ isOpen: true, action: "deactivate" })}
            >
              Deactivate Selected
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
              onClick={() => setSelectedIds([])}
            >
              Clear
            </Button>
          </div>
        </div>
      )}

      {/* ── 5. Main Data Presentation (Table on Desktop, Cards on Mobile) ── */}
      {error ? (
        <ErrorState
          title="Unable to Load Students"
          message={error}
          onRetry={() => fetchStudentsList(pagination.page)}
        />
      ) : (
        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ) : students.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow hoverable={false}>
                      <TableHead className="w-10">
                        <input
                          type="checkbox"
                          checked={isAllOnPageSelected}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          aria-label="Select all students on page"
                        />
                      </TableHead>
                      <TableHead>Student Candidate</TableHead>
                      <TableHead>Email Address</TableHead>
                      <TableHead>College / University</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Graduation</TableHead>
                      <TableHead>Account Status</TableHead>
                      <TableHead align="right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const studentName = `${student.firstName} ${student.lastName}`.trim();
                      const isSelected = selectedIds.includes(student._id);

                      return (
                        <TableRow key={student._id} className={isSelected ? "bg-slate-50/70" : ""}>
                          {/* Row Select Checkbox */}
                          <TableCell className="w-10">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectRow(student._id)}
                              className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                              aria-label={`Select ${studentName}`}
                            />
                          </TableCell>

                          {/* Student Identity */}
                          <TableCell className="font-semibold text-slate-900">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                size="sm"
                                name={studentName}
                                src={student.profilePhoto || undefined}
                              />
                              <div>
                                <span className="block font-semibold text-slate-900 tracking-tight leading-tight">
                                  {studentName}
                                </span>
                                <span className="block text-[11px] text-slate-400 font-mono mt-0.5">
                                  Joined {formatDate(student.createdAt)}
                                </span>
                              </div>
                            </div>
                          </TableCell>

                          {/* Email */}
                          <TableCell className="text-slate-600 text-xs font-mono">
                            <div>
                              <span>{student.email}</span>
                              {student.emailVerified && (
                                <span className="ml-1.5 text-[10px] text-emerald-600 font-sans font-semibold">
                                  ✓ Verified
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* College */}
                          <TableCell className="text-slate-700 text-xs max-w-[200px] truncate">
                            {student.college || "—"}
                          </TableCell>

                          {/* Branch */}
                          <TableCell className="text-slate-600 text-xs max-w-[150px] truncate">
                            {student.branch || "—"}
                          </TableCell>

                          {/* Graduation */}
                          <TableCell className="text-slate-600 text-xs font-mono">
                            {student.graduationYear ? `Class of ${student.graduationYear}` : "—"}
                          </TableCell>

                          {/* Account Status */}
                          <TableCell>
                            <StatusBadge status={student.isActive ? "active" : "inactive"} />
                          </TableCell>

                          {/* Actions */}
                          <TableCell align="right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenDetail(student)}
                                iconLeft={<EyeIcon className="w-3.5 h-3.5" />}
                              >
                                View
                              </Button>

                              <Button
                                variant={student.isActive ? "danger" : "outline"}
                                size="sm"
                                onClick={() => setStatusTargetStudent(student)}
                              >
                                {student.isActive ? "Deactivate" : "Activate"}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card Stack */}
              <div className="md:hidden divide-y divide-slate-100">
                {students.map((student) => {
                  const studentName = `${student.firstName} ${student.lastName}`.trim();
                  const isSelected = selectedIds.includes(student._id);

                  return (
                    <div key={student._id} className={`p-4 space-y-3 ${isSelected ? "bg-slate-50/70" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(student._id)}
                            className="rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                          />
                          <Avatar size="sm" name={studentName} src={student.profilePhoto || undefined} />
                          <div>
                            <span className="font-semibold text-slate-900 block text-sm">
                              {studentName}
                            </span>
                            <span className="text-slate-500 text-xs font-mono block">
                              {student.email}
                            </span>
                          </div>
                        </div>
                        <StatusBadge status={student.isActive ? "active" : "inactive"} />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            College
                          </span>
                          <span className="font-medium text-slate-800 truncate block">
                            {student.college || "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                            Branch
                          </span>
                          <span className="font-medium text-slate-800 truncate block">
                            {student.branch || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(student)}
                          iconLeft={<EyeIcon className="w-3.5 h-3.5" />}
                        >
                          View
                        </Button>
                        <Button
                          variant={student.isActive ? "danger" : "outline"}
                          size="sm"
                          onClick={() => setStatusTargetStudent(student)}
                        >
                          {student.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Pagination Footer ─────────────────────────────────── */}
              <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <div>
                  Showing <span className="font-semibold text-slate-800">{pageRangeStart}</span> to{" "}
                  <span className="font-semibold text-slate-800">{pageRangeEnd}</span> of{" "}
                  <span className="font-semibold text-slate-800">{pagination.total}</span> candidates
                </div>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchStudentsList(pagination.page - 1)}
                    iconLeft={<ChevronLeftIcon className="w-3.5 h-3.5" />}
                  >
                    Previous
                  </Button>

                  <span className="px-2 font-mono font-semibold text-slate-700">
                    {pagination.page} / {pagination.pages}
                  </span>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => fetchStudentsList(pagination.page + 1)}
                    iconRight={<ChevronRightIcon className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8">
              <EmptyState
                icon={<ProfileIcon className="w-8 h-8 text-slate-300" />}
                title="No candidates matched criteria"
                description={
                  hasActiveFilters
                    ? "Try loosening your active filters or clear search query to inspect all records."
                    : "No student records are currently registered in the database."
                }
                actionLabel={hasActiveFilters ? "Clear All Filters" : undefined}
                onAction={hasActiveFilters ? handleClearFilters : undefined}
              />
            </div>
          )}
        </Card>
      )}

      {/* ── 6. Single Status Confirmation Modal ───────────────────────── */}
      {statusTargetStudent && (
        <Modal
          isOpen={Boolean(statusTargetStudent)}
          onClose={() => setStatusTargetStudent(null)}
          title={statusTargetStudent.isActive ? "Deactivate Candidate Account" : "Activate Candidate Account"}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to{" "}
              <strong className="text-slate-900">
                {statusTargetStudent.isActive ? "deactivate" : "activate"}
              </strong>{" "}
              the account for{" "}
              <strong className="text-slate-900">
                {statusTargetStudent.firstName} {statusTargetStudent.lastName}
              </strong>{" "}
              ({statusTargetStudent.email})?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusTargetStudent(null)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={statusTargetStudent.isActive ? "danger" : "primary"}
                size="sm"
                onClick={handleConfirmStatusChange}
                loading={actionLoading}
              >
                {statusTargetStudent.isActive ? "Confirm Deactivation" : "Confirm Activation"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 7. Bulk Action Confirmation Modal ─────────────────────────── */}
      {bulkConfirmModal.isOpen && (
        <Modal
          isOpen={bulkConfirmModal.isOpen}
          onClose={() => setBulkConfirmModal({ isOpen: false, action: null })}
          title={`Bulk ${bulkConfirmModal.action === "activate" ? "Activation" : "Deactivation"}`}
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to{" "}
              <strong className="text-slate-900">
                {bulkConfirmModal.action === "activate" ? "activate" : "deactivate"}
              </strong>{" "}
              all <strong className="text-slate-900">{selectedIds.length}</strong> selected candidate
              accounts?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBulkConfirmModal({ isOpen: false, action: null })}
                disabled={bulkActionLoading}
              >
                Cancel
              </Button>
              <Button
                variant={bulkConfirmModal.action === "activate" ? "primary" : "danger"}
                size="sm"
                onClick={handleExecuteBulkStatus}
                loading={bulkActionLoading}
              >
                Confirm Bulk {bulkConfirmModal.action === "activate" ? "Activation" : "Deactivation"}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── 8. Detailed Candidate Profile Modal ───────────────────────── */}
      {selectedStudent && (
        <Modal
          isOpen={Boolean(selectedStudent)}
          onClose={() => setSelectedStudent(null)}
          title="Candidate Profile"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4 text-xs">
            {detailLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full rounded" />
                <Skeleton className="h-24 w-full rounded" />
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <Avatar
                    size="md"
                    name={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                    src={selectedStudent.profilePhoto || undefined}
                  />
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {selectedStudent.firstName} {selectedStudent.lastName}
                    </h3>
                    <p className="text-slate-500 font-mono text-xs">{selectedStudent.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-slate-700 bg-white border border-slate-100 p-3 rounded-lg">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">College</span>
                    <span className="font-medium">{selectedStudent.college || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Branch</span>
                    <span className="font-medium">{selectedStudent.branch || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Graduation</span>
                    <span className="font-medium font-mono">{selectedStudent.graduationYear || "—"}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">CGPA / Backlogs</span>
                    <span className="font-medium font-mono">
                      {selectedStudent.cgpa != null ? selectedStudent.cgpa : "—"} / {selectedStudent.backlogs ?? 0} backlogs
                    </span>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button variant="outline" size="sm" onClick={() => setSelectedStudent(null)}>
                    Close
                  </Button>
                </div>
              </>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

export default AdminStudentsPage;
