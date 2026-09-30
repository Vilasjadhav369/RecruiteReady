import { Link } from "react-router-dom";

/**
 * FeatureCard — Individual feature display card.
 *
 * @param {React.ReactNode} icon - SVG icon
 * @param {string} title
 * @param {string} description
 * @param {string} linkTo - Router path for CTA link
 * @param {string} linkLabel
 */
function FeatureCard({ icon, title, description, linkTo, linkLabel = "Learn more" }) {
  return (
    <div className="group bg-white border border-[#D9E2EC] rounded-xl p-6 hover:border-[#2563EB]/30 hover:shadow-sm transition-all duration-200 flex flex-col">
      <div className="w-10 h-10 bg-[#E8F1FF] rounded-lg flex items-center justify-center mb-4 group-hover:bg-[#2563EB] transition-colors duration-200 flex-shrink-0">
        <span className="text-[#2563EB] group-hover:text-white transition-colors duration-200">
          {icon}
        </span>
      </div>
      <h3 className="text-[#172B4D] font-semibold text-base mb-2">{title}</h3>
      <span className="text-[#52606D] text-sm leading-relaxed block mb-4 flex-1">{description}</span>
      {linkTo && (
        <Link
          to={linkTo}
          className="inline-flex items-center gap-1 text-sm font-semibold text-[#2563EB] hover:gap-2 transition-all duration-200 no-underline w-fit mt-auto"
        >
          {linkLabel}
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      )}
    </div>
  );
}

export default FeatureCard;
