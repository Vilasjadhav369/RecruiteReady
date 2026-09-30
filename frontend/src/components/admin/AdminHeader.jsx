import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { MenuIcon, LogoutIcon } from "../dashboard/DashboardIcons.jsx";

/**
 * AdminHeader — Clean top bar for the Admin workspace.
 */
function AdminHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#D9E2EC] px-4 sm:px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
        <div>
          <span className="text-[11px] text-[#52606D] block leading-none">Console</span>
          <span className="text-sm font-bold text-[#172B4D] tracking-tight block mt-0.5">
            RecruitReady Admin Workspace
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#D9E2EC]">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-[#172B4D]">
            {user?.firstName} ({user?.role})
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
        >
          <LogoutIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
