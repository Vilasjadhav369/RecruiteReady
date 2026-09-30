import { Link } from "react-router-dom";

/**
 * NotFoundPage — 404 page shown for unmatched routes.
 */
function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-[#F8FAFC]">
      <p className="text-7xl font-black text-[#D9E2EC] mb-6 tracking-tight">404</p>
      <h1 className="text-2xl font-bold text-[#172B4D] mb-3">Page not found</h1>
      <p className="text-[#52606D] mb-8 max-w-sm">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        to="/"
        className="text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-6 py-3 rounded-lg transition-colors no-underline hover:no-underline"
      >
        Back to Home
      </Link>
    </div>
  );
}

export default NotFoundPage;
