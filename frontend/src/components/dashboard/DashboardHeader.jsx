import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { MenuIcon, ProfileIcon, LogoutIcon, ChevronDownIcon, SearchIcon } from "../ui/Icons.jsx";
import { Avatar } from "../ui/Avatar.jsx";
import NotificationDropdown from "../notifications/NotificationDropdown.jsx";
import { ThemeToggle } from "../ui/ThemeToggle.jsx";
import GlobalSearchModal from "../search/GlobalSearchModal.jsx";
import { getModifierKeyHint } from "../../utils/formatters.js";

/**
 * Format user name safely
 */
function formatDisplayName(name) {
  if (!name || typeof name !== "string") return "";
  return name
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * DashboardHeader — Standardized single 56px header row for student workspace.
 * Clean, compact, accessible, with real authenticated student details and global search.
 */
function DashboardHeader({ onMenuClick }) {
  const { user, logout } = useAuth();
  const [profileDropdown, setProfileDropdown] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const modifierHint = getModifierKeyHint();

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

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
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [profileDropdown]);

  const handleLogout = async () => {
    setProfileDropdown(false);
    await logout();
    navigate("/login");
  };

  const displayName = formatDisplayName(
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.name || user?.email?.split("@")[0] || "Student"
  );

  return (
    <header className="h-14 border-b border-border bg-card px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 transition-colors">
      {/* Left: Mobile Drawer Trigger & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onMenuClick}
          className="lg:hidden p-1.5 -ml-1 text-ink-2 hover:text-ink hover:bg-primary-soft rounded-lg cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-primary"
          aria-label="Open sidebar menu"
        >
          <MenuIcon className="w-5 h-5" />
        </button>

        <h1 className="text-base sm:text-lg font-bold font-heading text-ink tracking-tight m-0 truncate">
          Dashboard
        </h1>
      </div>

      {/* Right: Search, Notifications & Profile Control */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Search Trigger Button */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-lg border border-border hover:border-border/80 bg-primary-soft hover:bg-card text-ink-2 hover:text-ink transition-all text-xs cursor-pointer shadow-2xs focus-visible:outline-2 focus-visible:outline-primary"
          aria-label={`Search RecruitReady (${modifierHint})`}
          title={`Search RecruitReady (${modifierHint})`}
        >
          <SearchIcon className="w-3.5 h-3.5 text-ink-2" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-ink-2 bg-card border border-border rounded">
            {modifierHint}
          </kbd>
        </button>

        <ThemeToggle />

        {/* Active Notification Center */}
        <NotificationDropdown />

        <div className="h-4 w-px bg-border hidden sm:block" aria-hidden="true" />

        {/* User Account Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setProfileDropdown(!profileDropdown)}
            className="min-h-[36px] flex items-center gap-2 px-2 sm:px-2.5 py-1 rounded-lg border border-border hover:border-border/80 bg-card hover:bg-primary-soft transition-all cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-primary"
            aria-expanded={profileDropdown}
            aria-label="User account menu"
            aria-haspopup="true"
          >
            <Avatar name={displayName} src={user?.avatar} size="xs" />
            <span className="text-xs font-medium text-ink hidden sm:inline-block max-w-[120px] truncate">
              {displayName}
            </span>
            <ChevronDownIcon
              className={`w-3.5 h-3.5 text-ink-2 transition-transform duration-150 ${
                profileDropdown ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileDropdown && (
            <div
              role="menu"
              aria-label="User options"
              className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-3.5 py-2.5 border-b border-border">
                <p className="text-xs font-semibold text-ink truncate m-0">{displayName}</p>
                <p className="text-[11px] text-ink-2 truncate m-0 mt-0.5" title={user?.email}>
                  {user?.email}
                </p>
                <span className="inline-block mt-1.5 text-[10px] font-mono font-medium px-1.5 py-0.5 rounded bg-primary-soft text-ink-2 uppercase tracking-wider">
                  {user?.role || "Student"}
                </span>
              </div>

              <div className="py-1">
                <Link
                  to="/profile"
                  role="menuitem"
                  onClick={() => setProfileDropdown(false)}
                  className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-ink hover:bg-primary-soft transition-colors no-underline font-medium"
                >
                  <ProfileIcon className="w-4 h-4 text-ink-2" />
                  Your Profile
                </Link>
              </div>

              <div className="pt-1 border-t border-border">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-danger hover:bg-primary-soft transition-colors text-left cursor-pointer font-medium"
                >
                  <LogoutIcon className="w-4 h-4 text-danger" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Search & Command Modal */}
      <GlobalSearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </header>
  );
}

export default DashboardHeader;
