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
} from "./DashboardIcons.jsx";

const NAV_ITEMS = [
  { label: "Dashboard",       to: "/dashboard",    icon: DashboardIcon },
  { label: "Aptitude",        to: "/aptitude",     icon: AptitudeIcon },
  { label: "Coding",          to: "/coding",       icon: CodingIcon },
  { label: "Mock Tests",      to: "/mock-tests",   icon: MockTestIcon },
  { label: "Companies",       to: "/companies",    icon: CompanyIcon },
  { label: "Study Materials", to: "/resources",    icon: ResourcesIcon },
  { label: "Progress",        to: "/progress",     icon: ProgressIcon },
  { label: "Reviews",         to: "/reviews",      icon: ResourcesIcon },
  { label: "Leaderboard",     to: "/leaderboard",  icon: ProgressIcon },
  { label: "Profile",         to: "/profile",      icon: ProfileIcon },
];

/**
 * StudentSidebar — Fixed sidebar for desktop & accessible drawer for mobile.
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
    <div className="flex flex-col h-full">
      {/* ── Brand / Header ───────────────────────── */}
      <div className="p-5 border-b border-[#D9E2EC] flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2.5 no-underline hover:no-underline"
          onClick={() => setMobileOpen && setMobileOpen(false)}
        >
          <div className="w-8 h-8 bg-[#102A43] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M3 14L9 4L15 14" stroke="#E8F1FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M5.5 10.5H12.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <span className="text-[#102A43] font-bold text-base tracking-tight leading-none block">
              RecruitReady
            </span>
            <span className="text-[#52606D] text-[10px] leading-none mt-1 block">
              Learn. Practice. Get Placed.
            </span>
          </div>
        </Link>

        {/* Mobile close button */}
        {setMobileOpen && (
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC] transition-colors"
            aria-label="Close navigation drawer"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Navigation Links ─────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Student navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline ${
                  isActive
                    ? "bg-[#E8F1FF] text-[#2563EB] font-semibold"
                    : "text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC]"
                }`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* ── User Profile & Sign Out ─────────────── */}
      <div className="p-3 border-t border-[#D9E2EC] bg-[#F8FAFC]">
        <div className="flex items-center gap-3 p-2 rounded-lg mb-2">
          <div className="w-9 h-9 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
            {user?.firstName?.[0]?.toUpperCase() ?? "S"}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-[#172B4D] truncate block">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-[11px] text-[#52606D] truncate block">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogoutIcon className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside className="hidden md:block w-64 h-screen sticky top-0 bg-white border-r border-[#D9E2EC] flex-shrink-0 z-30">
        {navContent}
      </aside>

      {/* Mobile drawer backdrop + aside */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 bottom-0 left-0 w-72 bg-white z-50 md:hidden transform transition-transform duration-250 ease-in-out shadow-2xl ${
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
