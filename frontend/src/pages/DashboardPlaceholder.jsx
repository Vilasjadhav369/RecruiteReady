import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * DashboardPlaceholder — Authenticated student account landing area.
 * Displays real authenticated user information without fake analytics or stats.
 */
function DashboardPlaceholder() {
  const { user, logout } = useAuth();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 lg:py-16">
      {/* Welcome Banner */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-[#D9E2EC]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[#E8F1FF] border-2 border-[#2563EB]/20 flex items-center justify-center text-xl font-bold text-[#2563EB]">
              {user?.firstName?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#E8F1FF] text-[#2563EB] mb-1 capitalize">
                {user?.role || "Student"} Account
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#172B4D]">
                Welcome, {user?.firstName} {user?.lastName}!
              </h1>
              <span className="text-sm text-[#52606D] block">{user?.email}</span>
            </div>
          </div>

          <button
            onClick={logout}
            className="text-xs font-semibold text-[#52606D] hover:text-[#172B4D] border border-[#D9E2EC] hover:bg-[#F8FAFC] px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>

        {/* Phase notification notice */}
        <div className="mt-6 p-4 bg-[#F8FAFC] border border-[#D9E2EC] rounded-xl flex items-start gap-3.5">
          <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
            ✓
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[#172B4D]">Account Authenticated & Active</h2>
            <p className="text-xs text-[#52606D] mt-0.5 leading-relaxed">
              Phase 4 authentication foundation is active. Your comprehensive placement preparation dashboard, practice modules, and test analytics will be integrated in Phase 5.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Details Card */}
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-[#172B4D] mb-6">Profile Information</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9FB3C8] block mb-1">
              Full Name
            </span>
            <span className="text-sm font-medium text-[#172B4D] block">
              {user?.firstName} {user?.lastName}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9FB3C8] block mb-1">
              Email Address
            </span>
            <span className="text-sm font-medium text-[#172B4D] block">
              {user?.email}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9FB3C8] block mb-1">
              College / Institution
            </span>
            <span className="text-sm font-medium text-[#172B4D] block">
              {user?.college || "Not specified"}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9FB3C8] block mb-1">
              Branch / Department
            </span>
            <span className="text-sm font-medium text-[#172B4D] block">
              {user?.branch || "Not specified"}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9FB3C8] block mb-1">
              Graduation Year
            </span>
            <span className="text-sm font-medium text-[#172B4D] block">
              {user?.graduationYear ? user.graduationYear : "Not specified"}
            </span>
          </div>

          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#9FB3C8] block mb-1">
              Account Role
            </span>
            <span className="text-sm font-medium text-[#172B4D] block capitalize">
              {user?.role || "student"}
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[#D9E2EC] flex items-center justify-between">
          <span className="text-xs text-[#9FB3C8]">
            Member since: {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Active"}
          </span>
          <Link
            to="/"
            className="text-xs font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline"
          >
            ← Back to Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default DashboardPlaceholder;
