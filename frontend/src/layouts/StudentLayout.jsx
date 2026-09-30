import { useState } from "react";
import { Outlet } from "react-router-dom";
import StudentSidebar from "../components/dashboard/StudentSidebar.jsx";
import DashboardHeader from "../components/dashboard/DashboardHeader.jsx";

/**
 * StudentLayout — App shell for all authenticated student pages.
 * Includes fixed desktop sidebar, mobile drawer, and top header.
 */
function StudentLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col md:flex-row overflow-x-hidden">
      {/* Sidebar (desktop fixed, mobile drawer) */}
      <StudentSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardHeader onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default StudentLayout;
