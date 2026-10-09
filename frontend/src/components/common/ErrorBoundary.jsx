import { Component } from "react";

/**
 * ErrorBoundary — Catches render errors so one broken page never white-screens the app.
 * Resets automatically when `resetKey` (the current route) changes.
 */
class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        role="alert"
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4"
      >
        <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center mb-4 text-red-600">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">This page hit a problem</h1>
        <p className="text-sm text-slate-600 max-w-md mb-6">
          Something went wrong while showing this page. Reload to try again, or go back to the dashboard.
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-dark text-white text-sm font-semibold cursor-pointer"
          >
            Reload page
          </button>
          <a
            href="/dashboard"
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-800 hover:border-emerald-300"
          >
            Go to dashboard
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
