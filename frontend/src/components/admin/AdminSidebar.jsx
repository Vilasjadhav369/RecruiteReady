import React, { useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  DashboardIcon,
  ProfileIcon,
  AptitudeIcon,
  CodingIcon,
  CompanyIcon,
  ResourcesIcon,
  MockTestIcon,
  ProgressIcon,
  LogoutIcon,
  CloseIcon,
  StarIcon,
} from "../ui/Icons.jsx";
import { Avatar } from "../ui/Avatar.jsx";

const NAV_SECTIONS = [
  {
    title: "Core",
    items: [
      { label: "Overview", to: "/admin", icon: DashboardIcon },
    ],
  },
  {
    title: "Catalog Management",
    items: [
      { label: "Students", to: "/admin/students", icon: ProfileIcon },
      { label: "Aptitude Questions", to: "/admin/aptitude", icon: AptitudeIcon },
      { label: "Coding Challenges", to: "/admin/coding", icon: CodingIcon },
      { label: "Company Archives", to: "/admin/companies", icon: CompanyIcon },
      { label: "Study Materials", to: "/admin/resources", icon: ResourcesIcon },
      { label: "Mock Assessments", to: "/admin/mock-tests", icon: MockTestIcon },
    ],
  },
  {
    title: "Insights & Moderation",
    items: [
      { label: "Student Reviews", to: "/admin/reviews", icon: StarIcon },
      { label: "System Analytics", to: "/admin/analytics", icon: ProgressIcon },
      { label: "Platform Settings", to: "/admin/settings", icon: DashboardIcon },
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
 * AdminSidebar — Professional content management sidebar for administrators.
 */
function AdminSidebar({ mobileOpen, setMobileOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const drawerRef = useRef(null);

  // Close on route change
  useEffect(() => {
    if (setMobileOpen) setMobileOpen(false);
  }, [location.pathname]);

  // Handle Escape key and body scroll lock
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

  const handleSignOut = async () => {
    if (setMobileOpen) setMobileOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  const navContent = (
    <div className="flex flex-col h-full bg-white">
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
            className="md:hidden min-w-[44px] min-h-[44px] p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors focus-visible:outline-2 focus-visible:outline-[#166534]"
            aria-label="Close navigation drawer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Navigation Links ─────────────────────── */}
      <nav
        className="flex-1 px-3 py-3.5 space-y-4 overflow-y-auto"
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
                  className={`min-h-[40px] flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all no-underline ${
                    active
                      ? "bg-[#DCFCE7] text-[#166534] font-semibold border-l-4 border-[#166534] shadow-xs"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70 border-l-4 border-transparent"
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

      {/* ── Admin User Card & Sign Out ───────────── */}
      <div className="p-3 border-t border-slate-200 bg-slate-50/70 shrink-0">
        <div className="flex items-center gap-2.5 p-1.5 rounded-lg mb-1">
          <Avatar name={user?.firstName || "Admin"} size="sm" />
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-900 truncate block">
              {user?.firstName ? `${user.firstName} ${user?.lastName || ""}`.trim() : "Administrator"}
            </span>
            <span className="text-[10px] text-slate-500 truncate block font-mono">
              {user?.email || "admin@recruitready.edu"}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="min-h-[38px] w-full flex items-center gap-2 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer text-left"
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
