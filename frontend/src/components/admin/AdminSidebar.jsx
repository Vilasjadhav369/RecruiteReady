import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardIcon,
  UsersIcon,
  AptitudeIcon,
  CodingIcon,
  CompanyIcon,
  ResourcesIcon,
  MockTestIcon,
  ProgressIcon,
  CloseIcon,
  StarIcon,
  SettingsIcon,
  ShieldCheckIcon,
} from "../ui/Icons.jsx";

const NAV_SECTIONS = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", to: "/admin", icon: DashboardIcon },
    ],
  },
  {
    title: "Users",
    items: [
      { label: "Students", to: "/admin/students", icon: UsersIcon },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Aptitude", to: "/admin/aptitude", icon: AptitudeIcon },
      { label: "Coding Problems", to: "/admin/coding", icon: CodingIcon },
      { label: "Companies", to: "/admin/companies", icon: CompanyIcon },
      { label: "Study Materials", to: "/admin/resources", icon: ResourcesIcon },
      { label: "Mock Tests", to: "/admin/mock-tests", icon: MockTestIcon },
    ],
  },
  {
    title: "Engagement",
    items: [
      { label: "Reviews", to: "/admin/reviews", icon: StarIcon },
    ],
  },
  {
    title: "Analytics",
    items: [
      { label: "Progress Analytics", to: "/admin/analytics", icon: ProgressIcon },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", to: "/admin/settings", icon: SettingsIcon },
    ],
  },
];

/**
 * Check whether an admin navigation route is active, including sub-paths.
 */
function isAdminNavActive(pathname, itemPath) {
  if (itemPath === "/admin") {
    return pathname === "/admin";
  }
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

/**
 * AdminSidebar — Professional hierarchical navigation sidebar for administrators.
 * Direction: Apple + Linear + Premium University
 * Full viewport height, stable width, clean borders, zero clipping.
 */
function AdminSidebar({ mobileOpen, setMobileOpen }) {
  const location = useLocation();
  const drawerRef = useRef(null);

  // Close mobile drawer on route change
  useEffect(() => {
    if (setMobileOpen) setMobileOpen(false);
  }, [location.pathname, setMobileOpen]);

  // Handle Escape key and body scroll lock for mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileOpen && setMobileOpen) {
        setMobileOpen(false);
      }
    };

    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, setMobileOpen]);

  const navContent = (
    <div className="flex flex-col h-full bg-white select-none">
      {/* ── Brand / Header ───────────────────────── */}
      <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between shrink-0">
        <Link
          to="/admin"
          className="flex items-center gap-2.5 no-underline hover:no-underline group"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        >
          <div className="w-8 h-8 rounded-lg bg-[#166534] flex items-center justify-center shrink-0 shadow-xs group-hover:bg-[#14532D] transition-colors">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path
                d="M10 3L3 7L10 11L17 7L10 3Z"
                stroke="#DCFCE7"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.5 8.5V13.5C5.5 13.5 7 15.5 10 15.5C13 15.5 14.5 13.5 14.5 13.5V8.5"
                stroke="#22C55E"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M17 7V12"
                stroke="#DCFCE7"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-900 font-bold text-sm tracking-tight leading-none">
                RecruitReady
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#14532D] px-1.5 py-0.5 rounded leading-none border border-[#BBF7D0]">
                Admin
              </span>
            </div>
            <span className="text-slate-500 text-[10px] leading-none mt-1 block">
              Workspace Administration
            </span>
          </div>
        </Link>

        {setMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#166534] cursor-pointer"
            aria-label="Close navigation drawer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Hierarchical Navigation Links ────────── */}
      <nav
        className="flex-1 px-3 py-3 space-y-3.5 overflow-y-auto"
        aria-label="Admin portal navigation"
      >
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-0.5">
            <span className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              {section.title}
            </span>
            {section.items.map((item) => {
              const Icon = item.icon;
              const active = isAdminNavActive(location.pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileOpen && setMobileOpen(false)}
                  className={`min-h-[38px] flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all no-underline ${
                    active
                      ? "bg-[#DCFCE7] text-[#166534] font-semibold border-l-3 border-[#166534] shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-l-3 border-transparent"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? "text-[#166534]" : "text-slate-500"
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── System Status Footer (Single clean indicator, no duplicate signout) ── */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/80 shrink-0">
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-800 block leading-tight truncate">
              Platform Online
            </span>
            <span className="text-[10px] text-slate-400 block leading-tight font-mono truncate">
              Academic Portal v1.0
            </span>
          </div>
          <ShieldCheckIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 bg-white border-r border-slate-200 shrink-0 z-30">
        {navContent}
      </aside>

      {/* Mobile drawer backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div
        ref={drawerRef}
        className={`fixed top-0 bottom-0 left-0 w-64 max-w-[85vw] bg-white z-50 md:hidden transform transition-transform duration-200 ease-in-out shadow-2xl ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Admin navigation menu"
      >
        {navContent}
      </div>
    </>
  );
}

export default AdminSidebar;
