import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import AdminHeader from "../components/admin/AdminHeader.jsx";

/**
 * AdminLayout — Layout shell for all administrator routes.
 */
function AdminLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-x-hidden">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <AdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader onMenuClick={() => setMobileOpen(true)} />
        <main id="main-content" className="animate-page flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
