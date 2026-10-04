import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { MenuIcon, LogoutIcon } from "../ui/Icons.jsx";
import { Badge } from "../ui/Badge.jsx";

/**
 * AdminHeader — Standardized top header for administrator workspace.
 * Clean, compact, professional CMS aesthetic.
 */
function AdminHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  const adminName = user?.firstName
    ? `${user.firstName} ${user?.lastName || ""}`.trim()
    : "Administrator";

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Workspace title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#166534]"
          aria-label="Open admin navigation menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block leading-none">
            Workspace
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-900 tracking-tight block mt-0.5">
            RecruitReady Admin Console
          </span>
        </div>
      </div>

      {/* Right: Authenticated User & Sign Out */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <Badge variant="brand" size="sm" dot>
            Admin
          </Badge>
          <span className="text-xs font-semibold text-slate-800">
            {adminName}
          </span>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="min-h-[38px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-transparent hover:border-red-100"
        >
          <LogoutIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}

export default AdminHeader;
