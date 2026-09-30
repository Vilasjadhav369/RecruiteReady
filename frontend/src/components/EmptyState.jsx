/**
 * EmptyState — Premium empty state for sections awaiting backend data.
 *
 * @param {React.ReactNode} icon
 * @param {string} title
 * @param {string} description
 * @param {React.ReactNode} action - Optional CTA element
 * @param {string} className
 */
function EmptyState({ icon, title, description, action, className = "" }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}>
      {icon && (
        <div className="w-12 h-12 bg-[#E8F1FF] rounded-xl flex items-center justify-center mb-4">
          <span className="text-[#2563EB] text-xl" aria-hidden="true">{icon}</span>
        </div>
      )}
      <span className="text-[#172B4D] font-semibold text-base block mb-2">{title}</span>
      {description && (
        <span className="text-[#52606D] text-sm max-w-xs leading-relaxed block mb-4">{description}</span>
      )}
      {action && action}
    </div>
  );
}

export default EmptyState;
