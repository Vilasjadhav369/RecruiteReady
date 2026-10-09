import React from "react";
import { Link } from "react-router-dom";

const FOOTER_SECTIONS = [
  {
    heading: "Product",
    links: [
      { label: "Aptitude Practice", to: "/aptitude" },
      { label: "Coding Problems", to: "/coding" },
      { label: "Mock Tests", to: "/mock-tests" },
      { label: "Company Preparation", to: "/companies" },
      { label: "Study Resources", to: "/resources" },
    ],
  },
  {
    heading: "Platform",
    links: [
      { label: "Student Dashboard", to: "/dashboard" },
      { label: "Progress Tracking", to: "/progress" },
      { label: "Campus Leaderboard", to: "/leaderboard" },
      { label: "Student Reviews", to: "/reviews" },
    ],
  },
  {
    heading: "Legal & Info",
    items: [
      { label: "Privacy Policy (Updated for 2026)", isPlaceholder: true },
      { label: "Terms of Service", isPlaceholder: true },
      { label: "Academic Honor Code", isPlaceholder: true },
    ],
  },
];

function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-slate-900 border-t border-slate-800 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">

        {/* Top grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 sm:gap-10 mb-10">

          {/* Brand column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 no-underline hover:no-underline group inline-flex">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0 shadow-xs group-hover:bg-primary-dark transition-colors">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                  <path
                    d="M10 3L3 7L10 11L17 7L10 3Z"
                    stroke="#DBEAFE"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M5.5 8.5V13.5C5.5 13.5 7 15.5 10 15.5C13 15.5 14.5 13.5 14.5 13.5V8.5"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M17 7V12"
                    stroke="#DBEAFE"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <div>
                <span className="text-white font-bold text-base tracking-tight leading-none block">
                  RecruitReady
                </span>
                <span className="text-emerald-400 text-[10px] leading-none mt-0.5 block">
                  Placement Preparation Platform
                </span>
              </div>
            </Link>

            <p className="text-slate-400 text-xs sm:text-sm max-w-sm leading-relaxed">
              An integrated campus placement portal offering curated coding challenges, aptitude modules, mock assessments, and company interview archives.
            </p>
          </div>

          {/* Link columns */}
          {FOOTER_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="text-slate-200 text-xs font-semibold uppercase tracking-wider mb-4">
                {section.heading}
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                {section.links &&
                  section.links.map((link) => (
                    <li key={link.to + link.label}>
                      <Link
                        to={link.to}
                        className="text-slate-400 hover:text-white transition-colors no-underline hover:no-underline"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                {section.items &&
                  section.items.map((item) => (
                    <li key={item.label} className="text-slate-500 text-xs select-none">
                      {item.label}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            &copy; {year} RecruitReady. All rights reserved.
          </p>
          <p className="text-[11px] text-slate-500">
            Engineered for academic placement excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
