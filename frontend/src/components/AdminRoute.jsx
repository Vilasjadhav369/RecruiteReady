import { Navigate, Outlet, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * AdminRoute — Restricts access strictly to users with role === 'admin'.
 */
function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-3 border-[#166534]/20 border-t-[#166534] rounded-full animate-spin mb-4" />
        <span className="text-sm text-slate-600 font-medium">Verifying permissions...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4 text-red-600 shadow-xs">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Access Denied</h1>
        <p className="text-slate-600 max-w-md mb-6 text-sm">
          You do not have administrative privileges to view this area.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#166534] hover:bg-[#14532D] px-5 py-2.5 rounded-lg transition-colors no-underline shadow-xs cursor-pointer"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return children ? children : <Outlet />;
}

export default AdminRoute;
