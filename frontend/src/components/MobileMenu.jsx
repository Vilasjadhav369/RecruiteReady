import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { Button } from "./ui/Button.jsx";

const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/#features" },
  { label: "Companies", to: "/companies" },
  { label: "Resources", to: "/resources" },
  { label: "About", to: "/#about" },
];

/**
 * MobileMenu — Accessible mobile navigation drawer with RecruitReady brand styling.
 */
function MobileMenu({ isOpen, onClose }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleLogout = async () => {
    onClose();
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div
      className="md:hidden border-t border-slate-200 bg-white"
      role="dialog"
      aria-label="Mobile navigation menu"
      aria-modal="true"
    >
      <nav className="px-4 py-3 flex flex-col gap-1" aria-label="Mobile navigation">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) => {
              const active = !link.to.includes("#") && isActive && (link.to === "/" ? window.location.pathname === "/" : true);
              return `min-h-[44px] flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors no-underline hover:no-underline ${
                active
                  ? "text-primary bg-primary-tint font-semibold"
                  : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"
              }`;
            }}
          >
            {link.label}
          </NavLink>
        ))}

        <div className="mt-2 pt-3 border-t border-slate-200 flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              <div className="px-3.5 py-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {user?.firstName?.[0]?.toUpperCase() ?? "S"}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-semibold text-slate-900 block truncate">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-[11px] text-slate-500 block truncate font-mono">
                    {user?.email}
                  </span>
                </div>
              </div>

              <Link
                to={user?.role === "admin" ? "/admin" : "/dashboard"}
                onClick={onClose}
                className="min-h-[44px] flex items-center px-3.5 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors no-underline"
              >
                {user?.role === "admin" ? "Go to Admin Portal" : "Go to Student Dashboard"}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] w-full text-left px-3.5 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <Link
                to="/login"
                onClick={onClose}
                className="min-h-[44px] flex items-center justify-center px-4 py-2.5 rounded-lg text-sm font-medium text-slate-800 hover:bg-slate-100 transition-colors no-underline"
              >
                Login
              </Link>

              <Button to="/register" onClick={onClose} variant="primary" fullWidth size="md">
                  Create Account
                </Button>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

export default MobileMenu;
