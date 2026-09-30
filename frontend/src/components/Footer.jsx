import { Link } from "react-router-dom";

const FOOTER_SECTIONS = [
  {
    heading: "Product",
    links: [
      { label: "Aptitude Practice",  to: "/aptitude" },
      { label: "Coding Practice",    to: "/coding" },
      { label: "Mock Tests",         to: "/mock-tests" },
      { label: "Progress Tracking",  to: "/dashboard" },
    ],
  },
  {
    heading: "Resources",
    links: [
      { label: "Study Materials",       to: "/resources" },
      { label: "Company Preparation",   to: "/companies" },
      { label: "Placement Resources",   to: "/resources" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About",           to: "/#about" },
      { label: "Contact",         to: "/#contact" },
      { label: "Privacy Policy",  to: "/privacy" },
    ],
  },
  {
    heading: "Account",
    links: [
      { label: "Login",              to: "/login" },
      { label: "Register",           to: "/register" },
      { label: "Student Dashboard",  to: "/dashboard" },
    ],
  },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#102A43]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">

          {/* Brand column */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 no-underline hover:no-underline mb-5">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M3 14L9 4L15 14" stroke="#E8F1FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5.5 10.5H12.5" stroke="#2563EB" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              </div>
              <div>
                <span className="text-white font-bold text-base tracking-tight leading-none block">
                  RecruitReady
                </span>
                <span className="text-white/40 text-[10px] leading-none">
                  Learn. Practice. Get Placed.
                </span>
              </div>
            </Link>
            <p className="text-white/50 text-sm leading-relaxed">
              The complete placement preparation platform for college students.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-5">
                {section.heading}
              </h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link
                      to={link.to}
                      className="text-white/60 hover:text-white text-sm transition-colors no-underline hover:no-underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-white/30 text-sm">
              &copy; {year} RecruitReady. All rights reserved.
            </p>
            <p className="text-white/20 text-xs mt-0.5">
              Built for smarter placement preparation.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
