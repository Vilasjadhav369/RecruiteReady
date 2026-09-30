import { NavLink, Link, useNavigate } from "react-router-dom";
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
} from "../dashboard/DashboardIcons.jsx";

const NAV_SECTIONS = [
  {
    title: "Core",
    items: [
      { label: "Overview", to: "/admin", icon: DashboardIcon },
    ],
  },
  {
    title: "Management",
    items: [
      { label: "Students", to: "/admin/students", icon: ProfileIcon },
      { label: "Aptitude", to: "/admin/aptitude", icon: AptitudeIcon },
      { label: "Coding", to: "/admin/coding", icon: CodingIcon },
      { label: "Companies", to: "/admin/companies", icon: CompanyIcon },
      { label: "Study Materials", to: "/admin/resources", icon: ResourcesIcon },
      { label: "Mock Tests", to: "/admin/mock-tests", icon: MockTestIcon },
    ],
  },
  {
    title: "Engagement & Insights",
    items: [
      { label: "Reviews", to: "/admin/reviews", icon: ResourcesIcon },
      { label: "Analytics", to: "/admin/analytics", icon: ProgressIcon },
      { label: "Settings", to: "/admin/settings", icon: DashboardIcon },
    ],
  },
];

/**
 * AdminSidebar — Specialized administrator sidebar navigation.
 */
function AdminSidebar({ mobileOpen, setMobileOpen }) {
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
      <div className="p-5 border-b border-[#D9E2EC] flex items-center justify-between">
        <Link
          to="/admin"
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
            <div className="flex items-center gap-1.5">
              <span className="text-[#102A43] font-bold text-sm tracking-tight leading-none">
                RecruitReady
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider bg-[#102A43] text-white px-1.5 py-0.5 rounded leading-none">
                Admin
              </span>
            </div>
            <span className="text-[#52606D] text-[10px] leading-none mt-1 block">
              Control & Moderation
            </span>
          </div>
        </Link>

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
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Admin navigation">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <span className="px-3 text-[10px] font-bold uppercase tracking-widest text-[#9FB3C8] block mb-1.5">
              {section.title}
            </span>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === "/admin"}
                    onClick={() => setMobileOpen && setMobileOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3.5 py-2 rounded-lg text-xs font-medium transition-colors no-underline ${
                        isActive
                          ? "bg-[#E8F1FF] text-[#2563EB] font-bold"
                          : "text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC]"
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Admin User Card & Sign Out ───────────── */}
      <div className="p-3 border-t border-[#D9E2EC] bg-[#F8FAFC]">
        <div className="flex items-center gap-3 p-2 rounded-lg mb-2">
          <div className="w-8 h-8 rounded-full bg-[#102A43] text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-xs">
            {user?.firstName?.[0]?.toUpperCase() ?? "A"}
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-xs font-bold text-[#172B4D] truncate block">
              {user?.firstName} {user?.lastName}
            </span>
            <span className="text-[10px] text-[#52606D] truncate block">
              {user?.email}
            </span>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
        >
          <LogoutIcon className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:block w-64 h-screen sticky top-0 bg-white border-r border-[#D9E2EC] flex-shrink-0 z-30">
        {navContent}
      </aside>

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
        aria-label="Admin navigation menu"
      >
        {navContent}
      </div>
    </>
  );
}

export default AdminSidebar;
