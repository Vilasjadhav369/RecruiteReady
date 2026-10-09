import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard, getStudents } from "../../services/adminService.js";
import AdminStatCard from "../../components/admin/AdminStatCard.jsx";
import {
  PageHeader,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ErrorState,
  EmptyState,
  Skeleton,
} from "../../components/ui/index.js";
import {
  ProfileIcon,
  UsersIcon,
  AptitudeIcon,
  CodingIcon,
  CompanyIcon,
  ResourcesIcon,
  MockTestIcon,
  StarIcon,
  ArrowRightIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentIcon,
  ShieldCheckIcon,
  RefreshIcon,
} from "../../components/ui/Icons.jsx";

/**
 * Safely parses any metric value to prevent NaN.
 * Handles nested objects ({ total: 5 }), strings, nulls, and undefined.
 */
function safeNumber(val, fallback = 0) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "number") return isNaN(val) ? fallback : val;
  if (typeof val === "object") {
    const extracted =
      val.total ??
      val.count ??
      val.questions ??
      val.problems ??
      val.active ??
      val.submissions ??
      val.attempts;
    if (typeof extracted === "number" && !isNaN(extracted)) return extracted;
    const parsed = Number(extracted);
    return isNaN(parsed) ? fallback : parsed;
  }
  const parsed = Number(val);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Format timestamp safely for activity and student lists
 */
function formatEventDate(dateString) {
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
 * Format relative or short time for activity feed
 */
function formatActivityTime(dateString) {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "—";
    const now = new Date();
    const diffMs = now - d;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "—";
  }
}

/**
 * AdminDashboardPage — Principal administrator overview dashboard.
 * Direction: Apple + Linear + Premium University
 * Strictly renders real backend data; zero fake numbers, zero NaN values.
 */
function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Execute dashboard stats & recent students preview in parallel
      const [dashData, studentsData] = await Promise.all([
        getAdminDashboard(),
        getStudents({ page: 1, limit: 5 }).catch((err) => {
          console.warn("Could not fetch recent students preview:", err);
          return null;
        }),
      ]);

      setStats(dashData || null);
      setRecentStudents(Array.isArray(studentsData?.students) ? studentsData.students : []);
    } catch (err) {
      console.error("Admin dashboard fetch failed:", err);
      setError("Unable to load platform statistics. Please verify backend connectivity.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Extract safe real metrics directly from API response
  const studentsTotal = safeNumber(stats?.students?.total);
  const studentsActive = safeNumber(stats?.students?.active);
  const aptitudeQuestions = safeNumber(stats?.aptitude?.questions);
  const aptitudeAttempts = safeNumber(stats?.aptitude?.attempts);
  const codingProblems = safeNumber(stats?.coding?.problems);
  const codingSubmissions = safeNumber(stats?.coding?.submissions);
  const companiesTotal = safeNumber(stats?.companies?.total ?? stats?.companies);
  const resourcesTotal = safeNumber(stats?.resources?.total ?? stats?.resources);
  const mockTestsTotal = safeNumber(stats?.mockTests?.total ?? stats?.mockTests);
  const mockTestsAttempts = safeNumber(stats?.mockTests?.attempts);
  const reviewsTotal = safeNumber(stats?.reviews?.total ?? stats?.reviews);

  // Pending Actions
  const pendingReviews = safeNumber(stats?.pendingActions?.pendingReviews ?? stats?.reviews?.pending);
  const inactiveQuestions = safeNumber(stats?.pendingActions?.inactiveQuestions);
  const inactiveProblems = safeNumber(stats?.pendingActions?.inactiveProblems);
  const unpublishedMockTests = safeNumber(stats?.pendingActions?.unpublishedMockTests);
  const totalPending = safeNumber(stats?.pendingActions?.totalPending);

  // Platform Health
  const healthStatus = stats?.health?.dbStatus === "connected" ? "Operational" : "Degraded";
  const uptimeHours = stats?.health?.uptimeSeconds
    ? Math.floor(stats.health.uptimeSeconds / 3600)
    : 0;
  const memoryMb = stats?.health?.memoryUsageMb ?? 0;

  // Activities array returned by API as `activity`
  const activities = Array.isArray(stats?.activity)
    ? stats.activity
    : Array.isArray(stats?.recentActivity)
    ? stats.recentActivity
    : [];

  // ─── ERROR STATE ────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="space-y-6 pb-12">
        <PageHeader
          title="Admin Dashboard"
          description="Platform administration console for campus placement preparation."
          breadcrumbs={[{ label: "Admin Console" }, { label: "Overview" }]}
        />
        <ErrorState
          title="Failed to Load Dashboard"
          message={error}
          onRetry={fetchDashboardData}
        />
      </div>
    );
  }

  // ─── LOADING STATE SKELETON ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 pb-12">
        <div className="space-y-2 border-b border-slate-200/80 pb-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-96" />
        </div>

        {/* 4 Stat card skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <AdminStatCard key={i} title="Metric" loading={true} />
          ))}
        </div>

        {/* Content skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <Skeleton className="h-5 w-48" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))}
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-32 rounded-lg" />
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
              <Skeleton className="h-5 w-36" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
              <Skeleton className="h-10 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16">
      {/* ── 1. Page Header ──────────────────────────────────────────── */}
      <PageHeader
        title="Admin Dashboard"
        description="Monitor real platform activity, student enrollment, and placement preparation resources."
        breadcrumbs={[{ label: "Admin Console" }, { label: "Overview" }]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboardData}
              iconLeft={<RefreshIcon className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
            <Button to="/admin/students" variant="primary" size="sm">
                Manage Students
              </Button>
          </div>
        }
      />

      {/* ── 2. Top-Level Core Metrics Grid (Strict Real Data) ──────── */}
      <section aria-labelledby="platform-metrics-heading">
        <h2 id="platform-metrics-heading" className="sr-only">
          Platform Overview Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <AdminStatCard
            title="Total Students"
            value={studentsTotal}
            subtitle={`${studentsActive} active candidates`}
            icon={ProfileIcon}
          />
          <AdminStatCard
            title="Aptitude Bank"
            value={aptitudeQuestions}
            subtitle={`${aptitudeAttempts} test attempts recorded`}
            icon={AptitudeIcon}
          />
          <AdminStatCard
            title="Coding Problems"
            value={codingProblems}
            subtitle={`${codingSubmissions} submissions recorded`}
            icon={CodingIcon}
          />
          <AdminStatCard
            title="Company Profiles"
            value={companiesTotal}
            subtitle="Campus hiring directories"
            icon={CompanyIcon}
          />
        </div>
      </section>

      {/* ── 3. Main Dashboard Body (Left: Content & Students, Right: Actions & Activity) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (8 cols): Modules Summary & Recent Students */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section: Platform Preparation Modules */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Preparation Subsystems</CardTitle>
                <CardDescription>
                  Live operational volume and student participation across all active preparation sections.
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                {/* Aptitude */}
                <Link
                  to="/admin/aptitude"
                  className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-primary-soft hover:border-primary-border transition-all text-left no-underline group block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase text-slate-500 group-hover:text-primary tracking-wider">
                      Aptitude
                    </span>
                    <AptitudeIcon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                    {aptitudeQuestions.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {aptitudeAttempts} attempts logged
                  </div>
                </Link>

                {/* Coding */}
                <Link
                  to="/admin/coding"
                  className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-primary-soft hover:border-primary-border transition-all text-left no-underline group block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase text-slate-500 group-hover:text-primary tracking-wider">
                      Coding
                    </span>
                    <CodingIcon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                    {codingProblems.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {codingSubmissions} code runs
                  </div>
                </Link>

                {/* Companies */}
                <Link
                  to="/admin/companies"
                  className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-primary-soft hover:border-primary-border transition-all text-left no-underline group block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase text-slate-500 group-hover:text-primary tracking-wider">
                      Companies
                    </span>
                    <CompanyIcon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                    {companiesTotal.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Profiles registered
                  </div>
                </Link>

                {/* Study Materials */}
                <Link
                  to="/admin/resources"
                  className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-primary-soft hover:border-primary-border transition-all text-left no-underline group block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase text-slate-500 group-hover:text-primary tracking-wider">
                      Materials
                    </span>
                    <ResourcesIcon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                    {resourcesTotal.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Curated resources
                  </div>
                </Link>

                {/* Mock Tests */}
                <Link
                  to="/admin/mock-tests"
                  className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-primary-soft hover:border-primary-border transition-all text-left no-underline group block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase text-slate-500 group-hover:text-primary tracking-wider">
                      Mock Tests
                    </span>
                    <MockTestIcon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                    {mockTestsTotal.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    {mockTestsAttempts} full attempts
                  </div>
                </Link>

                {/* Reviews */}
                <Link
                  to="/admin/reviews"
                  className="p-3.5 rounded-lg border border-slate-200/90 bg-slate-50/50 hover:bg-primary-soft hover:border-primary-border transition-all text-left no-underline group block"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-semibold uppercase text-slate-500 group-hover:text-primary tracking-wider">
                      Reviews
                    </span>
                    <StarIcon className="w-4 h-4 text-slate-400 group-hover:text-primary" />
                  </div>
                  <div className="text-xl font-bold text-slate-900 tracking-tight font-mono">
                    {reviewsTotal.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 truncate">
                    Candidate reviews
                  </div>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Section: Recently Enrolled Students */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Student Registrations</CardTitle>
                <CardDescription>
                  Newly registered candidates in the campus placement portal.
                </CardDescription>
              </div>
              <Button to="/admin/students" variant="ghost" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
                  View All
                </Button>
            </CardHeader>

            {recentStudents.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="border-t border-slate-100">
                  <TableHeader>
                    <TableRow hoverable={false}>
                      <TableHead>Student</TableHead>
                      <TableHead>College</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Registered</TableHead>
                      <TableHead align="right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentStudents.map((st) => (
                      <TableRow key={st._id}>
                        <TableCell className="font-semibold text-slate-900">
                          {st.firstName} {st.lastName}
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {st.college || "—"}
                        </TableCell>
                        <TableCell className="text-slate-600 text-xs">
                          {st.branch || "—"}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs font-mono">
                          {formatEventDate(st.createdAt)}
                        </TableCell>
                        <TableCell align="right">
                          <Badge
                            variant={st.isActive ? "success" : "default"}
                            dot={st.isActive}
                            size="sm"
                          >
                            {st.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <CardContent className="py-8 text-center">
                <EmptyState
                  icon={<ProfileIcon className="w-6 h-6 text-slate-400" />}
                  title="No students registered yet"
                  description="When candidates register for the portal, they will be listed here automatically."
                />
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column (4 cols): Pending Actions, Quick Nav, Platform Health & Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Pending Actions Alert / Overview */}
          {totalPending > 0 && (
            <Card className="border-amber-200/80 bg-amber-50/30">
              <CardHeader className="pb-2.5 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm text-amber-900 font-semibold flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    Pending Actions ({totalPending})
                  </CardTitle>
                  <CardDescription className="text-xs text-amber-700/80">
                    Content & reviews awaiting administrator action
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="space-y-1.5 p-3">
                {pendingReviews > 0 && (
                  <Link
                    to="/admin/reviews"
                    className="flex items-center justify-between p-2 rounded-md bg-white border border-amber-200/60 text-xs font-medium text-slate-700 hover:bg-amber-100/50 transition-colors no-underline"
                  >
                    <span>Student Reviews</span>
                    <Badge variant="warning" size="sm">{pendingReviews} pending</Badge>
                  </Link>
                )}
                {unpublishedMockTests > 0 && (
                  <Link
                    to="/admin/mock-tests"
                    className="flex items-center justify-between p-2 rounded-md bg-white border border-amber-200/60 text-xs font-medium text-slate-700 hover:bg-amber-100/50 transition-colors no-underline"
                  >
                    <span>Unpublished Mock Tests</span>
                    <Badge variant="outline" size="sm">{unpublishedMockTests} drafts</Badge>
                  </Link>
                )}
                {inactiveQuestions > 0 && (
                  <Link
                    to="/admin/aptitude"
                    className="flex items-center justify-between p-2 rounded-md bg-white border border-amber-200/60 text-xs font-medium text-slate-700 hover:bg-amber-100/50 transition-colors no-underline"
                  >
                    <span>Inactive Aptitude Questions</span>
                    <Badge variant="outline" size="sm">{inactiveQuestions} inactive</Badge>
                  </Link>
                )}
                {inactiveProblems > 0 && (
                  <Link
                    to="/admin/coding"
                    className="flex items-center justify-between p-2 rounded-md bg-white border border-amber-200/60 text-xs font-medium text-slate-700 hover:bg-amber-100/50 transition-colors no-underline"
                  >
                    <span>Inactive Coding Problems</span>
                    <Badge variant="outline" size="sm">{inactiveProblems} inactive</Badge>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Management Shortcuts */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Quick Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 p-3">
              <Link
                to="/admin/students"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-soft text-xs font-semibold text-slate-700 hover:text-primary transition-colors no-underline group"
              >
                <div className="flex items-center gap-2.5">
                  <UsersIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  <span>Student Directory</span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary" />
              </Link>

              <Link
                to="/admin/aptitude"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-soft text-xs font-semibold text-slate-700 hover:text-primary transition-colors no-underline group"
              >
                <div className="flex items-center gap-2.5">
                  <AptitudeIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  <span>Aptitude Questions</span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary" />
              </Link>

              <Link
                to="/admin/coding"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-soft text-xs font-semibold text-slate-700 hover:text-primary transition-colors no-underline group"
              >
                <div className="flex items-center gap-2.5">
                  <CodingIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  <span>Coding Problem Bank</span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary" />
              </Link>

              <Link
                to="/admin/companies"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-soft text-xs font-semibold text-slate-700 hover:text-primary transition-colors no-underline group"
              >
                <div className="flex items-center gap-2.5">
                  <CompanyIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  <span>Company Profiles</span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary" />
              </Link>

              <Link
                to="/admin/reviews"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-soft text-xs font-semibold text-slate-700 hover:text-primary transition-colors no-underline group"
              >
                <div className="flex items-center gap-2.5">
                  <StarIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  <span>Review Moderation</span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary" />
              </Link>

              <Link
                to="/admin/audit-logs"
                className="flex items-center justify-between p-2.5 rounded-lg hover:bg-primary-soft text-xs font-semibold text-slate-700 hover:text-primary transition-colors no-underline group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheckIcon className="w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                  <span>Audit Trail</span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary" />
              </Link>
            </CardContent>
          </Card>

          {/* Platform Health Widget */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Platform Health</CardTitle>
                <CardDescription>Live database & service diagnostics</CardDescription>
              </div>
              <Badge variant={healthStatus === "Operational" ? "success" : "danger"} size="sm" dot>
                {healthStatus}
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5 pt-0 space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Database</span>
                  <span className="font-semibold text-slate-800">{stats?.health?.dbStatus === "connected" ? "MongoDB Live" : "Degraded"}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 block uppercase font-mono">Memory</span>
                  <span className="font-semibold text-slate-800 font-mono">{memoryMb} MB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real Platform Activity Log */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Recent Activity</CardTitle>
                <CardDescription>Live events recorded in system log</CardDescription>
              </div>
              {activities.length > 0 && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-mono">
                  {activities.length} logs
                </span>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {activities.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {activities.map((act, idx) => {
                    const isRegistration = act.type === "user_registration";
                    const isQuestion = act.type === "question_created";

                    return (
                      <div
                        key={idx}
                        className="p-3.5 flex items-start justify-between gap-3 hover:bg-slate-50/50 transition-colors"
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-7 h-7 rounded-md bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                            {isRegistration ? (
                              <ProfileIcon className="w-3.5 h-3.5 text-primary" />
                            ) : isQuestion ? (
                              <DocumentIcon className="w-3.5 h-3.5 text-slate-600" />
                            ) : (
                              <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="text-xs font-semibold text-slate-900 block truncate">
                              {act.title}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {act.subtitle || "System activity"}
                            </span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {formatActivityTime(act.timestamp)}
                          </span>
                          {act.status && (
                            <span
                              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold mt-0.5 ${
                                act.status === "active" || act.status === "submitted"
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "bg-slate-100 text-slate-600"
                              }`}
                            >
                              {act.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <EmptyState
                    icon={<ClockIcon className="w-5 h-5 text-slate-400" />}
                    title="No recent activity"
                    description="Real platform events will appear here as students register and take assessments."
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* System Security Notice */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
              <ShieldCheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Placement Integrity Mode</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              All metrics and attempt counts are computed in real time from verified student activity records.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
