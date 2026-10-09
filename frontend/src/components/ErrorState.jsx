/**
 * ErrorState — Displayed when a data fetch fails.
 *
 * @param {string} message - Error message
 * @param {Function} onRetry - Optional retry handler
 */
function ErrorState({ message = "Unable to load this data. Please try again.", onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="w-10 h-10 bg-red-50 border border-red-100 rounded-xl flex items-center justify-center mb-3">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="9" cy="9" r="8" stroke="#DC2626" strokeWidth="1.5"/>
          <path d="M9 5V9M9 12.5V13" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <span className="text-[#52606D] text-sm block mb-3">{message}</span>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs font-semibold text-primary hover:text-primary-dark hover:underline cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export default ErrorState;
