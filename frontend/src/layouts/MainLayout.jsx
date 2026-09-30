import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

/**
 * MainLayout — Shared layout for all public-facing pages.
 * Renders the persistent Navbar, page content via <Outlet />, and Footer.
 */
function MainLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] overflow-x-hidden">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
