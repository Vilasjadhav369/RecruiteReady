import { Navigate, Outlet, useLocation } from "react-router-dom";
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
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <span className="text-sm text-slate-600 font-medium">Verifying permissions...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    // /admin routes accept only role admin; students visiting /admin go to /dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children ? children : <Outlet />;
}

export default AdminRoute;
