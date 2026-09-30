import { Link, NavLink, useNavigate } from "react-router-dom";
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
 * MobileMenu — Accessible mobile navigation drawer with auth state.
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
      className="md:hidden border-t border-[#D9E2EC] bg-white"
      role="dialog"
      aria-label="Mobile navigation menu"
      aria-modal="true"
    >
      <nav className="px-4 pb-5 pt-2 flex flex-col gap-1" aria-label="Mobile navigation">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={onClose}
            className={({ isActive }) =>
              `px-3 py-3 rounded-lg text-sm font-medium transition-colors no-underline hover:no-underline ${
                isActive && link.to === "/"
                  ? "text-[#2563EB] bg-[#E8F1FF]"
                  : "text-[#52606D] hover:text-[#172B4D] hover:bg-[#F8FAFC]"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}

        <div className="mt-3 pt-3 border-t border-[#D9E2EC] flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              <div className="px-3 py-2 bg-[#F8FAFC] rounded-lg border border-[#D9E2EC] flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#2563EB] text-white flex items-center justify-center text-xs font-bold">
                  {user?.firstName?.[0]?.toUpperCase() ?? "U"}
                </div>
                <div>
                  <span className="text-xs font-bold text-[#172B4D] block">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="text-[10px] text-[#52606D] block">{user?.email}</span>
                </div>
              </div>

              <Link
                to="/dashboard"
                onClick={onClose}
                className="px-3 py-2.5 rounded-lg text-sm font-medium text-[#172B4D] hover:bg-[#F8FAFC] transition-colors no-underline"
              >
                Go to Dashboard
              </Link>

              <button
                onClick={handleLogout}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                onClick={onClose}
                className="px-3 py-3 rounded-lg text-sm font-medium text-[#172B4D] hover:bg-[#F8FAFC] transition-colors no-underline hover:no-underline"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-4 py-3 rounded-lg text-center transition-colors no-underline hover:no-underline shadow-sm"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default MobileMenu;
