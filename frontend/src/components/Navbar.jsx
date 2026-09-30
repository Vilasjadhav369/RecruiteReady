import { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import MobileMenu from "./MobileMenu.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const NAV_LINKS = [
  { label: "Home",       to: "/" },
  { label: "Features",   to: "/#features" },
  { label: "Companies",  to: "/companies" },
  { label: "Mock Tests", to: "/mock-tests" },
  { label: "Resources",  to: "/resources" },
  { label: "About",      to: "/#about" },
];

/**
 * Navbar — Premium sticky navigation bar with dynamic authentication state.
 */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white border-b border-[#D9E2EC] transition-shadow duration-200 ${
        scrolled ? "shadow-sm" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Logo ─────────────────────────────────── */}
          <Link to="/" className="flex items-center gap-2.5 no-underline hover:no-underline flex-shrink-0">
            <div className="w-8 h-8 bg-[#102A43] rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                <path d="M3 14L9 4L15 14" stroke="#E8F1FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M5.5 10.5H12.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <span className="text-[#102A43] font-bold text-base tracking-tight leading-none block">
                RecruitReady
              </span>
              <span className="text-[#52606D] text-[10px] leading-none">
                Learn. Practice. Get Placed.
              </span>
            </div>
          </Link>

          {/* ── Desktop Nav ───────────────────────────── */}
          <nav className="hidden md:flex items-center gap-0.5" aria-label="Main navigation">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-md text-sm font-medium transition-colors no-underline hover:no-underline ${
                    isActive && link.to === "/"
                      ? "text-[#2563EB]"
                      : "text-[#52606D] hover:text-[#172B4D]"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* ── Desktop Right ─────────────────────────── */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Search */}
            <button
              className="p-2 rounded-md text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
              aria-label="Search"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M10 10L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </button>

            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#D9E2EC] hover:border-[#2563EB]/40 transition-colors no-underline"
                >
                  <div className="w-6 h-6 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold">
                    {user?.firstName?.[0]?.toUpperCase() ?? "U"}
                  </div>
                  <span className="text-xs font-semibold text-[#172B4D]">
                    {user?.firstName || "Dashboard"}
                  </span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="text-xs font-semibold text-[#52606D] hover:text-[#172B4D] px-3 py-2 rounded-md hover:bg-[#F8FAFC] transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-[#172B4D] hover:text-[#2563EB] transition-colors no-underline hover:no-underline px-3 py-2"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-4 py-2 rounded-lg transition-colors no-underline hover:no-underline shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* ── Mobile Hamburger ──────────────────────── */}
          <button
            className="md:hidden p-2 rounded-md text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC] transition-colors cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4L16 16M16 4L4 16" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M3 5H17M3 10H17M3 15H17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Mobile Menu ───────────────────────────── */}
      <div id="mobile-menu">
        <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </header>
  );
}

export default Navbar;
