import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StudentSidebar from "../components/dashboard/StudentSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";

/**
 * StudentLayout — App shell for all authenticated student pages.
 * Includes fixed desktop sidebar, mobile drawer, and top header.
 * Uses overflow-x-clip to preserve position:sticky behavior across all viewports.
 * Automatically presents a distraction-free focused shell during active assessment sessions.
 */
function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem("rr_test_banner_dismissed") === "1";
    } catch {
      return false;
    }
  });
  const location = useLocation();

  const handleDismissBanner = () => {
    setBannerDismissed(true);
    try {
      sessionStorage.setItem("rr_test_banner_dismissed", "1");
    } catch {}
  };

  const isAssessmentSession = location.pathname.includes("/session/");

  if (isAssessmentSession) {
    return (
      <div className="min-h-screen bg-background">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-x-clip">
      {/* Sidebar (desktop fixed, mobile drawer) */}
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <StudentSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {!bannerDismissed && (
          <aside
            aria-label="Test version notice"
            className="bg-amber-50 border-b border-amber-200 text-amber-900 px-3.5 py-1.5 text-xs flex items-center justify-between gap-3 shrink-0"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="px-1.5 py-0.5 rounded font-bold uppercase tracking-wider text-[10px] bg-amber-200 text-amber-900 shrink-0">
                Test version
              </span>
              <span className="truncate text-slate-700">
                Evaluation release for candidate testing. Questions and stats may update. Contact: <span className="font-mono font-medium text-slate-900">[CONTACT_EMAIL]</span>
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismissBanner}
              aria-label="Dismiss test version notice"
              className="text-slate-500 hover:text-slate-900 font-bold text-base leading-none p-1 rounded hover:bg-amber-100 transition-colors cursor-pointer shrink-0"
            >
              &times;
            </button>
          </aside>
        )}
        <DashboardHeader onMenuClick={() => setMobileOpen(true)} />
        <main key={location.pathname} id="main-content" className="animate-slide-in flex-1 p-3 sm:p-4 lg:px-6 lg:py-3.5 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
