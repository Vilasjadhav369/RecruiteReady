import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { MenuIcon, BellIcon, ProfileIcon, LogoutIcon, ChevronDownIcon } from "../ui/Icons.jsx";
import { Avatar } from "../ui/Avatar.jsx";

/**
 * DashboardHeader — Top navigation bar for authenticated dashboard.
 * Uses unified design system tokens with responsive mobile drawer trigger.
 */
function DashboardHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setProfileDropdown(false);
    await logout();
    navigate("/", { replace: true });
  };

  const displayName = user?.firstName || "Student";
  const fullName = `${user?.firstName || ""} ${user?.lastName || ""}`.trim() || "Student";

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200/90 px-4 sm:px-6 py-3 flex items-center justify-between">
      {/* Left: Mobile hamburger & Context label */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Open sidebar navigation"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block leading-none">
            RecruitReady Portal
          </span>
          <span className="text-xs font-medium text-slate-600 mt-1 block">
            Placement Preparation
          </span>
        </div>
      </div>

      {/* Right: Notification & Profile */}
      <div className="flex items-center gap-2.5">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
          aria-label="Notifications (no unread notifications)"
          title="No unread notifications"
        >
          <BellIcon className="w-4 h-4" />
          <span className="sr-only">Notifications</span>
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />

        {/* User Pill / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdown(!profileDropdown)}
            className="flex items-center gap-2 p-1 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-2xs"
            aria-expanded={profileDropdown}
            aria-label="User account menu"
          >
            <Avatar name={displayName} size="xs" />
            <span className="hidden sm:block text-xs font-semibold text-slate-800">
              {displayName}
            </span>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {profileDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdown(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 text-xs font-medium animate-in fade-in zoom-in-95 duration-100">
                <div className="px-3 py-2 border-b border-slate-100 mb-1">
                  <span className="font-bold text-slate-900 block truncate">
                    {fullName}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate font-mono">
                    {user?.email}
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setProfileDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors no-underline"
                >
                  <ProfileIcon className="w-4 h-4 text-slate-500" />
                  <span>My Profile</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                >
                  <LogoutIcon className="w-4 h-4 text-red-500" />
                  <span>Sign Out</span>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
