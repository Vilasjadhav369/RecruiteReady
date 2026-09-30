import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { MenuIcon, BellIcon, ProfileIcon, LogoutIcon } from "./DashboardIcons.jsx";
import { useState } from "react";

/**
 * DashboardHeader — Top navigation bar for authenticated dashboard.
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

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-[#D9E2EC] px-4 sm:px-6 py-3.5 flex items-center justify-between">
      {/* Left: Mobile hamburger & Greeting */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden p-1.5 rounded-lg text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          aria-label="Open sidebar navigation"
        >
          <MenuIcon className="w-6 h-6" />
        </button>

        <div>
          <span className="text-xs text-[#52606D] block leading-none">Welcome back,</span>
          <span className="text-base font-bold text-[#172B4D] tracking-tight leading-snug block">
            {user?.firstName || "Student"}
          </span>
        </div>
      </div>

      {/* Right: Notifications & User profile avatar */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          className="relative p-2 rounded-lg text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
          aria-label="Notifications (no unread notifications)"
          title="No unread notifications"
        >
          <BellIcon className="w-5 h-5" />
        </button>

        {/* User Pill / Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileDropdown(!profileDropdown)}
            className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-lg border border-[#D9E2EC] hover:border-[#2563EB]/40 bg-[#F8FAFC] hover:bg-white transition-all cursor-pointer"
            aria-expanded={profileDropdown}
            aria-label="User account menu"
          >
            <div className="w-7 h-7 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
              {user?.firstName?.[0]?.toUpperCase() ?? "S"}
            </div>
            <span className="hidden sm:block text-xs font-semibold text-[#172B4D]">
              {user?.firstName}
            </span>
          </button>

          {/* Dropdown Menu */}
          {profileDropdown && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileDropdown(false)}
                aria-hidden="true"
              />
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#D9E2EC] rounded-xl shadow-lg p-1.5 z-40 text-xs font-medium">
                <div className="px-3 py-2 border-b border-[#D9E2EC] mb-1">
                  <span className="font-bold text-[#172B4D] block truncate">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-[11px] text-[#52606D] block truncate">
                    {user?.email}
                  </span>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setProfileDropdown(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#172B4D] hover:bg-[#F8FAFC] transition-colors no-underline"
                >
                  <ProfileIcon className="w-4 h-4 text-[#52606D]" />
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
