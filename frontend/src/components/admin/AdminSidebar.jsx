import Logo from "../common/Logo.jsx";
import { useSidebarCollapsed } from "../../hooks/useSidebarCollapsed.js";
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
      { label: "Audit Logs", to: "/admin/audit-logs", icon: ShieldCheckIcon },
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
  const [collapsed, toggleCollapsed] = useSidebarCollapsed("admin");
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
        {collapsed ? (
          <div className="w-full flex items-center justify-center">
            <Logo variant="symbol" size={26} to="/admin" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Logo variant="compact" size="sm" to="/admin" />
            <span className="rr-nav-hide px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-primary-tint text-primary border border-primary-border">
              Admin
            </span>
          </div>
        )}

        {setMobileOpen && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
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
            <span className="rr-nav-group px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
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
                      ? "bg-primary-tint text-primary font-semibold border-l-3 border-primary shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-l-3 border-transparent"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      active ? "text-primary" : "text-slate-500"
                    }`}
                  />
                  <span className="rr-nav-label truncate">{item.label}</span>
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
          <div className="rr-nav-hide min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-800 block leading-tight truncate">
              Platform Online
            </span>
            <span className="text-[10px] text-slate-400 block leading-tight font-mono truncate">
              Academic Portal v1.0
            </span>
          </div>
          <ShieldCheckIcon className="rr-nav-hide w-3.5 h-3.5 text-slate-400 shrink-0" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside data-collapsed={collapsed} className="rr-sidebar hidden md:block w-64 h-screen sticky top-0 bg-white border-r border-slate-200 shrink-0 z-30">
        {navContent}
        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="rr-sidebar-toggle w-6 h-6 rounded-full border border-slate-300 bg-white text-slate-600 hover:text-slate-900 hover:border-slate-900 grid place-items-center cursor-pointer transition-colors"
        >
          <svg className={`w-3 h-3 transition-transform ${collapsed ? "rotate-180" : ""}`} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" /></svg>
        </button>
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
        inert={!mobileOpen}
        aria-label="Admin navigation menu"
      >
        {navContent}
      </div>
    </>
  );
}

export default AdminSidebar;
