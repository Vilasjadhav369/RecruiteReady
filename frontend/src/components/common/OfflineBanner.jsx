import { useOnlineStatus } from "../../hooks/useOnlineStatus.js";

/**
 * OfflineBanner — honest connectivity notice. Server-backed features (tests,
 * coding runs, saving) need a connection; we say so instead of pretending.
 */
export default function OfflineBanner() {
  const online = useOnlineStatus();
  if (online) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="rr-banner-in fixed top-0 inset-x-0 z-[90] bg-amber-500 text-slate-950 text-xs sm:text-sm font-semibold text-center px-4 py-2 shadow-md"
    >
      You're offline. Practice, tests and saving need a connection. Your last loaded pages may still be visible.
    </div>
  );
}
