import React from "react";
import { ArrowLeftIcon, DashboardIcon } from "../components/ui/Icons.jsx";
import { Button } from "../components/ui/Button.jsx";

/**
 * NotFoundPage — 404 page shown for unmatched routes.
 * Standardized with RecruitReady design system tokens and navigation options.
 */
function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-background">
      <div className="w-16 h-16 rounded-2xl bg-primary-tint text-primary flex items-center justify-center text-2xl font-black mb-6 shadow-xs border border-primary-border">
        404
      </div>
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-2">Page not found</h1>
      <p className="text-slate-500 mb-8 max-w-md text-sm leading-relaxed">
        The page you are looking for does not exist, has been moved, or is temporarily unavailable.
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <Button to="/dashboard" variant="primary" size="md" iconLeft={<DashboardIcon className="w-4 h-4" />}>
            Go to Dashboard
          </Button>
        <Button to="/" variant="outline" size="md" iconLeft={<ArrowLeftIcon className="w-4 h-4" />}>
            Return Home
          </Button>
      </div>
    </div>
  );
}

export default NotFoundPage;
