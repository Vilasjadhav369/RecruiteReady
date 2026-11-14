import React, { useState } from "react";

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="shrink-0">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

/**
 * GitHubSignInButton — Initiates GitHub OAuth authentication flow.
 *
 * Adheres to:
 * - Apple + Linear + Premium University aesthetics
 * - Minimized scope (read:user user:email)
 * - Safe server-side state generation
 * - Accessible keyboard navigation & states
 */
export function GitHubSignInButton({ disabled = false, onError }) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleGitHubClick = () => {
    if (disabled || isRedirecting) return;

    setIsRedirecting(true);

    try {
      // Determine backend endpoint: relative /api/auth/github works via Vite proxy in dev
      // Fallback directly to localhost:5000 if needed
      const backendUrl = import.meta.env.VITE_API_URL
        ? `${import.meta.env.VITE_API_URL}/api/auth/github`
        : "/api/auth/github";

      window.location.href = backendUrl;
    } catch {
      setIsRedirecting(false);
      if (onError) onError("Failed to initiate GitHub authentication. Please try again.");
    }
  };

  return (
    <button
      type="button"
      onClick={handleGitHubClick}
      disabled={disabled || isRedirecting}
      aria-label="Continue with GitHub"
      className="w-full h-11 px-4 bg-[#24292F] hover:bg-[#1B1F23] active:bg-[#161B22] text-white border border-slate-800 rounded-lg flex items-center justify-center gap-3 text-sm font-semibold transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-slate-400/30 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isRedirecting ? (
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <span>Connecting to GitHub...</span>
        </div>
      ) : (
        <>
          <GitHubIcon />
          <span>Continue with GitHub</span>
        </>
      )}
    </button>
  );
}

export default GitHubSignInButton;
