import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * ProtectedRoute — Ensures only authenticated users can access the route.
 * Redirects to /login with state preserved for post-login redirect.
 */
function ProtectedRoute({ children }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
        <span className="text-sm text-slate-500">Verifying session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Mandatory consent gate for first-time Google/GitHub candidates
  if (user && user.role === "student" && !user.consentAcceptedAt && location.pathname !== "/consent") {
    return <Navigate to="/consent" replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
