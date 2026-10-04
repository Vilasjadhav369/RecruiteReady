import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { MenuIcon, BellIcon, ProfileIcon, LogoutIcon, ChevronDownIcon } from "../ui/Icons.jsx";
import { Avatar } from "../ui/Avatar.jsx";

/**
 * DashboardHeader — Standardized header for student workspace.
 * Clean, compact, accessible, with real authenticated student details.
 */
function DashboardHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click or Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && profileDropdown) {
        setProfileDropdown(false);
      }
    };
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileDropdown(false);
      }
    };

    if (profileDropdown) {
      window.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdown]);

  const handleLogout = async () => {
    setProfileDropdown(false);
    await logout();
    navigate("/", { replace: true });
  };

  const displayName = user?.firstName || "Student";
  const fullName = user?.firstName
    ? `${user.firstName} ${user?.lastName || ""}`.trim()
    : "Student User";

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Context label */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#166534]"
          aria-label="Open navigation menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block leading-none">
            Student Portal
          </span>
          <span className="text-xs font-semibold text-slate-800 mt-1 block">
            Placement Preparation Workspace
          </span>
        </div>
      </div>

      {/* Right: Notifications & Profile Control */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notification Bell (Honest indicator) */}
        <button
          type="button"
          className="min-w-[40px] min-h-[40px] p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#166534]"
          aria-label="Notifications"
          title="Notifications"
        >
          <BellIcon className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-200 hidden sm:block" aria-hidden="true" />

        {/* User Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdown(!profileDropdown)}
            className="min-h-[40px] flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-[#166534]"
            aria-expanded={profileDropdown}
            aria-label="User account menu"
            aria-haspopup="true"
          >
            <Avatar name={displayName} size="xs" />
            <span className="hidden sm:block text-xs font-semibold text-slate-800 max-w-[120px] truncate">
              {displayName}
            </span>
            <ChevronDownIcon className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>

          {/* Dropdown Menu */}
          {profileDropdown && (
            <div
              className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 z-40 text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
              role="menu"
              aria-orientation="vertical"
              aria-label="User account actions"
            >
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <span className="font-bold text-slate-900 block truncate">
                  {fullName}
                </span>
                <span className="text-[11px] text-slate-500 block truncate font-mono">
                  {user?.email || "student@recruitready.edu"}
                </span>
              </div>

              <Link
                to="/profile"
                onClick={() => setProfileDropdown(false)}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-[#DCFCE7] hover:text-[#166534] transition-colors no-underline"
                role="menuitem"
              >
                <ProfileIcon className="w-4 h-4 text-slate-500" />
                <span>My Profile</span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-left"
                role="menuitem"
              >
                <LogoutIcon className="w-4 h-4 text-red-500" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default DashboardHeader;
