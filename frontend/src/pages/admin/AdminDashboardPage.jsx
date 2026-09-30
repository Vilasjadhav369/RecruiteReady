import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { getAdminDashboard } from "../../services/adminService.js";
import AdminStatCard from "../../components/admin/AdminStatCard.jsx";
import {
  ProfileIcon,
  AptitudeIcon,
  CodingIcon,
  CompanyIcon,
  ResourcesIcon,
  MockTestIcon,
  ArrowRightIcon,
} from "../../components/dashboard/DashboardIcons.jsx";
import ErrorState from "../../components/ErrorState.jsx";

function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminDashboard();
      setStats(data);
    } catch (err) {
      console.error("Admin dashboard fetch failed:", err);
      setError("Unable to load platform statistics. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const students = stats?.students || { total: 0, active: 0 };
  const aptitude = stats?.aptitude || { questions: 0, active: 0 };
  const activities = stats?.recentActivity || [];

  return (
    <div className="space-y-8 pb-12">
      {/* ── Heading ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#102A43] text-white mb-2">
            Platform Administration
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D] tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-xs text-[#52606D] mt-1">
            Manage RecruiteReady and monitor real platform activity.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/students"
            className="px-4 py-2 bg-white border border-[#D9E2EC] hover:border-[#2563EB]/40 text-xs font-semibold text-[#172B4D] rounded-lg transition-colors no-underline shadow-xs"
          >
            Manage Students
          </Link>
          <Link
            to="/admin/aptitude"
            className="px-4 py-2 bg-[#2563EB] hover:bg-[#1d4ed8] text-xs font-semibold text-white rounded-lg transition-colors no-underline shadow-xs"
          >
            Manage Aptitude
          </Link>
        </div>
      </div>

      {error && (
        <div className="bg-white border border-[#D9E2EC] rounded-2xl p-8">
          <ErrorState message={error} onRetry={fetchStats} />
        </div>
      )}

      {/* ── Key Metrics Grid ───────────────────────────────────── */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-wider text-[#52606D] mb-3">
          Platform Statistics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
          <AdminStatCard
            title="Total Students"
            value={students.total}
            subtitle={`${students.active} active accounts`}
            icon={ProfileIcon}
            loading={loading}
          />
          <AdminStatCard
            title="Aptitude Questions"
            value={aptitude.questions}
            subtitle={`${aptitude.active} active in question bank`}
            icon={AptitudeIcon}
            loading={loading}
          />
          <AdminStatCard
            title="Coding Problems"
            value={stats?.coding?.problems || 0}
            subtitle="Phase 7 module"
            icon={CodingIcon}
            loading={loading}
          />
          <AdminStatCard
            title="Companies"
            value={stats?.companies || 0}
            subtitle="Phase 9 module"
            icon={CompanyIcon}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Management Shortcuts & Recent Activity ──────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Shortcuts */}
        <div className="lg:col-span-1 bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#172B4D] mb-1">Management Shortcuts</h2>
            <p className="text-xs text-[#52606D] mb-4">Quick links to core administrative sections</p>

            <div className="space-y-2">
              <Link
                to="/admin/students"
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#E8F1FF] text-xs font-semibold text-[#172B4D] hover:text-[#2563EB] transition-colors no-underline border border-[#D9E2EC]"
              >
                <div className="flex items-center gap-2.5">
                  <ProfileIcon className="w-4 h-4 text-[#2563EB]" />
                  <span>Student Directory</span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>

              <Link
                to="/admin/aptitude"
                className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC] hover:bg-[#E8F1FF] text-xs font-semibold text-[#172B4D] hover:text-[#2563EB] transition-colors no-underline border border-[#D9E2EC]"
              >
                <div className="flex items-center gap-2.5">
                  <AptitudeIcon className="w-4 h-4 text-[#2563EB]" />
                  <span>Aptitude Question Bank</span>
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5" />
              </Link>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC]/50 text-xs font-medium text-[#9FB3C8] border border-dashed border-[#D9E2EC]">
                <div className="flex items-center gap-2.5">
                  <CodingIcon className="w-4 h-4" />
                  <span>Coding Problem Bank</span>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded">Phase 7</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-[#F8FAFC]/50 text-xs font-medium text-[#9FB3C8] border border-dashed border-[#D9E2EC]">
                <div className="flex items-center gap-2.5">
                  <MockTestIcon className="w-4 h-4" />
                  <span>Mock Test Assessments</span>
                </div>
                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded">Phase 8</span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-[#D9E2EC] text-[11px] text-[#52606D]">
            All metrics are live and synchronized directly with the database.
          </div>
        </div>

        {/* Real Platform Activity */}
        <div className="lg:col-span-2 bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-[#172B4D]">Recent Platform Activity</h2>
              <p className="text-xs text-[#52606D] mt-0.5">Real events logged in the database</p>
            </div>
            {activities.length > 0 && (
              <span className="text-xs font-semibold text-[#52606D] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#D9E2EC]">
                {activities.length} Events
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3 py-4">
              <div className="h-10 bg-[#F8FAFC] rounded-lg animate-pulse" />
              <div className="h-10 bg-[#F8FAFC] rounded-lg animate-pulse" />
              <div className="h-10 bg-[#F8FAFC] rounded-lg animate-pulse" />
            </div>
          ) : activities.length > 0 ? (
            <div className="divide-y divide-[#D9E2EC]/70">
              {activities.map((act, idx) => (
                <div key={idx} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F1FF] text-[#2563EB] flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {act.type === "user_registration" ? "👤" : "📝"}
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#172B4D] block">{act.title}</span>
                      <span className="text-[11px] text-[#52606D] block">{act.subtitle}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-[10px] text-[#9FB3C8] block">
                      {new Date(act.timestamp).toLocaleDateString()}
                    </span>
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${act.status === "active" ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-600"}`}>
                      {act.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-[#F8FAFC] border border-[#D9E2EC] mx-auto flex items-center justify-center text-[#9FB3C8] mb-3">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15 15" />
                </svg>
              </div>
              <h3 className="text-sm font-bold text-[#172B4D] mb-1">No recent platform activity</h3>
              <p className="text-xs text-[#52606D] max-w-sm mx-auto leading-relaxed">
                Platform data and recent events will appear here automatically as students register and content is authored.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboardPage;
