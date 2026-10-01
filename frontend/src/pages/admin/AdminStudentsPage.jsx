import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  getStudents,
  getStudentById,
  updateStudentStatus,
} from "../../services/adminService.js";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  IconButton,
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
  CloseIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  AcademicCapIcon,
  CompanyIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UsersIcon,
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
 * AdminStudentsPage — Candidate management, credential inspection, and account moderation.
 * Direction: Apple + Linear + Premium University
 * Strictly operates on real MongoDB records with real pagination and filters.
 */
function AdminStudentsPage() {
  const [students, setStudents] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Student Detail Modal state
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Status Confirmation Modal state
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
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError("Unable to load student directory. Please verify server connectivity.");
      } finally {
        setLoading(false);
      }
    },
    [activeSearch, statusFilter]
  );

  // Debounce search changes by 350ms to prevent request flooding
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchTerm.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Refetch when debounced search or status filter changes (reset to page 1)
  useEffect(() => {
    fetchStudentsList(1);
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

  // Execute account status toggle with confirmation
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

  // Quick reset for all applied filters
  const handleClearFilters = () => {
    setSearchTerm("");
    setActiveSearch("");
    setStatusFilter("all");
  };

  const hasActiveFilters = Boolean(activeSearch || statusFilter !== "all");

  // Summary counts
  const pageRangeStart = pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const pageRangeEnd = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. Page Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Students"
        description="Inspect registered candidate profiles, verify academic credentials, and toggle account activation status."
        breadcrumbs={[
          { label: "Admin Console", href: "/admin" },
          { label: "Students" },
        ]}
        actions={
          <div className="flex items-center gap-2">
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

      {/* ── 3. Search & Filters Control Bar ─────────────────────────── */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="w-full sm:w-96">
            <SearchInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm("")}
              placeholder="Search by name, email, college..."
              size="md"
            />
          </div>

          {/* Status Segmented Filters */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
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
        </CardContent>
      </Card>

      {/* ── 4. Main Data Presentation (Table on Desktop, Cards on Mobile) ── */}
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

                      return (
                        <TableRow key={student._id}>
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
                            {student.email}
                          </TableCell>

                          {/* College */}
                          <TableCell className="text-slate-700 text-xs max-w-[220px] truncate">
                            {student.college || "—"}
                          </TableCell>

                          {/* Branch */}
                          <TableCell className="text-slate-600 text-xs max-w-[160px] truncate">
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

                  return (
                    <div key={student._id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar
                            size="md"
                            name={studentName}
                            src={student.profilePhoto || undefined}
                          />
                          <div>
                            <span className="font-bold text-sm text-slate-900 block leading-tight">
                              {studentName}
                            </span>
                            <span className="text-xs text-slate-500 font-mono block mt-0.5">
                              {student.email}
                            </span>
                          </div>
                        </div>

                        <StatusBadge status={student.isActive ? "active" : "inactive"} />
                      </div>

                      <div className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">College:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">
                            {student.college || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Branch:</span>
                          <span className="font-medium text-slate-800 truncate max-w-[200px]">
                            {student.branch || "—"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Class:</span>
                          <span className="font-mono text-slate-800">
                            {student.graduationYear || "—"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 pt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          fullWidth
                          onClick={() => handleOpenDetail(student)}
                          iconLeft={<EyeIcon className="w-3.5 h-3.5" />}
                        >
                          View Details
                        </Button>

                        <Button
                          variant={student.isActive ? "danger" : "outline"}
                          size="sm"
                          fullWidth
                          onClick={() => setStatusTargetStudent(student)}
                        >
                          {student.isActive ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── 5. Professional Pagination ───────────────────────── */}
              <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  Showing{" "}
                  <span className="font-semibold text-slate-900 font-mono">
                    {pageRangeStart}–{pageRangeEnd}
                  </span>{" "}
                  of <span className="font-semibold text-slate-900 font-mono">{pagination.total}</span>{" "}
                  registered candidates
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page <= 1 || loading}
                    onClick={() => fetchStudentsList(pagination.page - 1)}
                    iconLeft={<ChevronLeftIcon className="w-3.5 h-3.5" />}
                  >
                    Previous
                  </Button>

                  <div className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 font-mono text-slate-800 font-semibold shadow-2xs">
                    {pagination.page} / {pagination.pages}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={pagination.page >= pagination.pages || loading}
                    onClick={() => fetchStudentsList(pagination.page + 1)}
                    iconRight={<ChevronRightIcon className="w-3.5 h-3.5" />}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <CardContent className="py-16 text-center">
              {hasActiveFilters ? (
                <EmptyState
                  icon={<SearchIcon className="w-6 h-6 text-slate-400" />}
                  title="No candidates match your criteria"
                  description="We could not find any student records matching your active search keywords or status filter."
                  action={
                    <Button variant="outline" size="sm" onClick={handleClearFilters}>
                      Clear Search & Filters
                    </Button>
                  }
                />
              ) : (
                <EmptyState
                  icon={<ProfileIcon className="w-6 h-6 text-slate-400" />}
                  title="No students registered yet"
                  description="Candidate accounts will appear in this administrative roster once students register on the portal."
                />
              )}
            </CardContent>
          )}
        </Card>
      )}

      {/* ── 6. Student Detail Inspection Modal ──────────────────────── */}
      <Modal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title="Student Profile"
        description="Verified institutional identity and candidate placement preferences."
        maxWidth="max-w-xl"
        footer={
          selectedStudent && (
            <div className="flex items-center justify-between w-full">
              <Button
                variant={selectedStudent.isActive ? "danger" : "outline"}
                size="sm"
                onClick={() => {
                  setStatusTargetStudent(selectedStudent);
                }}
              >
                {selectedStudent.isActive ? "Deactivate Account" : "Activate Account"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedStudent(null)}
              >
                Close
              </Button>
            </div>
          )
        }
      >
        {selectedStudent && (
          <div className="space-y-5">
            {/* Candidate Identity Header */}
            <div className="flex items-start gap-3.5 pb-4 border-b border-slate-100">
              <Avatar
                size="lg"
                name={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                src={selectedStudent.profilePhoto || undefined}
                className="w-12 h-12 text-sm"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-base font-bold text-slate-900 tracking-tight truncate">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h4>
                  <StatusBadge status={selectedStudent.isActive ? "active" : "inactive"} />
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                  {selectedStudent.email}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="primary">
                    {selectedStudent.role === "admin" ? "Platform Administrator" : "Student Candidate"}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Academic Background
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[11px]">College / University</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedStudent.college || "Not specified"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Department / Branch</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block">
                    {selectedStudent.branch || "Not specified"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Graduation Year</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block font-mono">
                    {selectedStudent.graduationYear ? `Class of ${selectedStudent.graduationYear}` : "Not specified"}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Registration Date</span>
                  <span className="font-semibold text-slate-800 mt-0.5 block font-mono">
                    {formatDate(selectedStudent.createdAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Target Companies */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Target Companies
              </span>
              {selectedStudent.targetCompanies?.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selectedStudent.targetCompanies.map((c, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-md bg-white border border-slate-200 text-xs font-medium text-slate-800 shadow-2xs"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No target companies specified by candidate.</p>
              )}
            </div>

            {/* Preparation Goals */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                Preparation Goals
              </span>
              {selectedStudent.preparationGoals?.length > 0 ? (
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {selectedStudent.preparationGoals.map((g, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <span>{g}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-400 italic">No custom preparation milestones defined.</p>
              )}
            </div>

            {/* Integrity Notice */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 flex items-center gap-2">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Account credentials and assessment logs are secured under campus placement privacy regulations.
              </span>
            </div>
          </div>
        )}
      </Modal>

      {/* ── 7. Status Change Confirmation Modal ────────────────────── */}
      <Modal
        isOpen={Boolean(statusTargetStudent)}
        onClose={() => !actionLoading && setStatusTargetStudent(null)}
        title={statusTargetStudent?.isActive ? "Deactivate Student Account" : "Activate Student Account"}
        description="Verify account status modification before applying changes."
        maxWidth="max-w-md"
        footer={
          <div className="flex items-center justify-end gap-2.5 w-full">
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={() => setStatusTargetStudent(null)}
            >
              Cancel
            </Button>

            <Button
              variant={statusTargetStudent?.isActive ? "danger" : "primary"}
              size="sm"
              loading={actionLoading}
              onClick={handleConfirmStatusChange}
            >
              {statusTargetStudent?.isActive ? "Confirm Deactivation" : "Confirm Activation"}
            </Button>
          </div>
        }
      >
        {statusTargetStudent && (
          <div className="space-y-3 text-xs text-slate-600">
            <p>
              You are about to modify the account status for candidate{" "}
              <strong className="text-slate-900">
                {statusTargetStudent.firstName} {statusTargetStudent.lastName}
              </strong>{" "}
              (<span className="font-mono text-slate-700">{statusTargetStudent.email}</span>).
            </p>

            {statusTargetStudent.isActive ? (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 leading-relaxed">
                <strong>Effect:</strong> Deactivating will prevent this student from logging in and accessing test sessions. Completed history and scorecards are preserved. This action can be reversed at any time.
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 leading-relaxed">
                <strong>Effect:</strong> Activating will restore immediate portal access, allowing the candidate to resume practice tests and interview preparation modules.
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AdminStudentsPage;
