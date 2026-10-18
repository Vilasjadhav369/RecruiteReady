import { ThemeToggle } from "./ui/ThemeToggle.jsx";
import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate, useLocation } from "react-router-dom";
import MobileMenu from "./MobileMenu.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "./ui/Button.jsx";
import { CloseIcon, MenuIcon } from "./ui/Icons.jsx";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/#features" },
  { label: "Companies", to: "/companies" },
  { label: "Resources", to: "/resources" },
  { label: "About", to: "/#about" },
];

/**
 * Navbar — Authoritative public navigation bar for RecruitReady.
 * Adheres to Apple + Linear + Modern University aesthetic.
 */
function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && mobileOpen) {
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
  }, [mobileOpen]);

  const handleLogout = async () => {
    setMobileOpen(false);
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <header
      className={`sticky top-0 z-50 bg-white/95 backdrop-blur-xs border-b border-slate-200 transition-shadow duration-200 ${
        scrolled ? "shadow-xs" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* ── Brand Logo ───────────────────────────────── */}
          <Link
            to="/"
            className="flex items-center gap-2.5 no-underline hover:no-underline shrink-0 group"
          >
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-xs group-hover:bg-primary-dark transition-colors">
              <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path
                  d="M10 3L3 7L10 11L17 7L10 3Z"
                  stroke="var(--rr-on-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5.5 8.5V13.5C5.5 13.5 7 15.5 10 15.5C13 15.5 14.5 13.5 14.5 13.5V8.5"
                  stroke="var(--rr-on-primary)" strokeOpacity=".55"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 7V12"
                  stroke="var(--rr-on-primary)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <div>
              <span className="text-slate-900 font-bold text-base tracking-tight leading-none block">
                RecruitReady
              </span>
              <span className="text-slate-500 text-[10px] leading-none mt-0.5 block">
                Placement Preparation Portal
              </span>
            </div>
          </Link>

          {/* ── Desktop Center Navigation ─────────────────── */}
          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map((link) => {
              const isAnchor = link.to.includes("#");
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) => {
                    const active = !isAnchor && isActive && (link.to === "/" ? location.pathname === "/" : true);
                    return `px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors no-underline hover:no-underline ${
                      active
                        ? "text-primary bg-primary-tint font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
                    }`;
                  }}
                >
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          {/* ── Desktop Right Actions ─────────────────────── */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/dashboard"
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-primary/50 transition-colors no-underline text-xs font-semibold text-slate-800"
                >
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                    {user?.firstName?.[0]?.toUpperCase() ?? "S"}
                  </div>
                  <span>Dashboard</span>
                </Link>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-red-700 hover:bg-red-50"
                >
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-2 text-sm font-medium text-slate-700 hover:text-primary hover:bg-slate-100/60 rounded-lg transition-colors no-underline hover:no-underline"
                >
                  Login
                </Link>

                <Button to="/register" variant="primary" size="md">
                    Create Account
                  </Button>
              </div>
            )}
          </div>

          {/* ── Mobile Theme + Hamburger ──────────────────── */}
          <div className="md:hidden flex items-center gap-1.5">
          <ThemeToggle />
          <button
            type="button"
            className="md:hidden min-w-[44px] min-h-[44px] p-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-primary"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
          >
            {mobileOpen ? (
              <CloseIcon className="w-5 h-5" />
            ) : (
              <MenuIcon className="w-5 h-5" />
            )}
          </button>
          </div>
        </div>
      </div>

      {/* ── Mobile Menu Panel ─────────────────────────── */}
      <div id="mobile-menu">
        <MobileMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      </div>
    </header>
  );
}

export default Navbar;
