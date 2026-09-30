import React from "react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  DashboardIcon,
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompanyIcon,
  ResourcesIcon,
  ProgressIcon,
  ProfileIcon,
  LogoutIcon,
  CloseIcon,
  StarIcon,
  TrophyIcon,
} from "../ui/Icons.jsx";
import { Avatar } from "../ui/Avatar.jsx";

const NAV_ITEMS = [
  { label: "Dashboard",       to: "/dashboard",    icon: DashboardIcon },
  { label: "Aptitude",        to: "/aptitude",     icon: AptitudeIcon },
  { label: "Coding",          to: "/coding",       icon: CodingIcon },
  { label: "Mock Tests",      to: "/mock-tests",   icon: MockTestIcon },
  { label: "Companies",       to: "/companies",    icon: CompanyIcon },
  { label: "Study Materials", to: "/resources",    icon: ResourcesIcon },
  { label: "Progress",        to: "/progress",     icon: ProgressIcon },
  { label: "Reviews",         to: "/reviews",      icon: StarIcon },
  { label: "Leaderboard",     to: "/leaderboard",  icon: TrophyIcon },
  { label: "Profile",         to: "/profile",      icon: ProfileIcon },
];

/**
 * StudentSidebar — Fixed sidebar for desktop & accessible drawer for mobile.
 * Visual direction: Apple + Linear + Premium University.
 */
function StudentSidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    if (setMobileOpen) setMobileOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white">
      {/* ── Brand / Header ───────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-200/90 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline hover:no-underline group"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        >
          <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-blue-600 transition-colors duration-150">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 14L9 4L15 14" stroke="#EFF6FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 10.5H12.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span className="text-slate-900 font-bold text-sm sm:text-base tracking-tight leading-none block">
              RecruitReady
            </span>
            <span className="text-slate-500 text-[10px] leading-none mt-1 block">
              Placement Preparation
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation drawer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Navigation Links ─────────────────────── */}
      <nav className="flex-1 px-3 py-3.5 space-y-0.5 overflow-y-auto" aria-label="Student navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors no-underline ${
                  isActive
                    ? "bg-blue-50 text-blue-700 font-semibold shadow-2xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User Profile & Sign Out ─────────────── */}
      <div className="p-3 border-t border-slate-200/90 bg-slate-50/50">
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg mb-1.5">
          <Avatar name={user?.firstName || "Student"} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-900 truncate block">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-[10px] text-slate-500 truncate block font-mono">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
        >
          <LogoutIcon className="w-3.5 h-3.5 text-red-500" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block w-60 h-screen sticky top-0 bg-white border-r border-slate-200/90 shrink-0 z-30">
        {navContent}
      </aside>

      {/* Mobile drawer backdrop + aside */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 w-64 bg-white z-50 md:hidden transform transition-transform duration-200 ease-in-out shadow-xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Student navigation menu"
      >
        {navContent}
      </div>
    </>
  );
}

export default StudentSidebar;
