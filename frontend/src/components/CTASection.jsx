import { Link } from "react-router-dom";

/**
 * CTASection — Premium call-to-action section.
 * Dark navy background, minimal and confident.
 */
function CTASection() {
  return (
    <section className="bg-[#102A43] py-20 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 leading-tight">
          Your Placement Preparation Starts Here.
        </h2>
        <p className="text-white/60 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
          Build consistent preparation habits, measure your progress, and walk into placement season with confidence.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-8 py-3.5 rounded-lg transition-colors duration-200 no-underline hover:no-underline"
          >
            Get Started
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
          <Link
            to="/#features"
            className="inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white border border-white/20 hover:border-white/40 px-8 py-3.5 rounded-lg transition-all duration-200 no-underline hover:no-underline"
          >
            Explore Platform
          </Link>
        </div>
      </div>
    </section>
  );
}

export default CTASection;
