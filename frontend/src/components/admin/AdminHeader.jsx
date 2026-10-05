import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { MenuIcon, LogoutIcon, SettingsIcon, SearchIcon } from "../ui/Icons.jsx";
import { Avatar } from "../ui/Avatar.jsx";
import NotificationDropdown from "../notifications/NotificationDropdown.jsx";
import GlobalSearchModal from "../search/GlobalSearchModal.jsx";

/**
 * AdminHeader — Single authoritative top header for administrator workspace.
 * Clean, compact, professional CMS aesthetic aligned with RecruitReady design system.
 */
function AdminHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
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

      {/* Right: Authenticated User, Settings, & Sign Out */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User Identity & Unclipped Role Badge */}
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
          <Avatar
            name={adminName}
            firstName={user?.firstName}
            lastName={user?.lastName}
            size="sm"
            src={user?.profilePhoto || undefined}
          />
          <span className="hidden sm:inline text-xs font-semibold text-slate-900 truncate max-w-[150px]">
            {adminName}
          </span>
          <span
            className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0] rounded-md shrink-0 whitespace-nowrap leading-none select-none"
            aria-label="User role: Administrator"
          >
            ADMIN
          </span>
        </div>

        {/* Global Search Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-all text-xs cursor-pointer shadow-2xs focus-visible:outline-2 focus-visible:outline-[#166534]"
          aria-label="Search RecruitReady"
          title="Search RecruitReady"
        >
          <SearchIcon className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden md:inline">Search...</span>
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* Settings Shortcut */}
        <Link
          to="/admin/settings"
          className="min-w-[36px] min-h-[36px] p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#166534]"
          title="Platform Settings"
          aria-label="Platform Settings"
        >
          <SettingsIcon className="w-4 h-4" />
        </Link>

        {/* Single Authoritative Sign Out */}
        <button
          type="button"
          onClick={handleLogout}
          className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 rounded-lg transition-colors cursor-pointer border border-slate-200 hover:border-red-200 shadow-2xs focus-visible:outline-2 focus-visible:outline-red-600"
        >
          <LogoutIcon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

export default AdminHeader;
