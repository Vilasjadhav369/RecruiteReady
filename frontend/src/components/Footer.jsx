import Logo from "./common/Logo.jsx";
import React from "react";
import { Link } from "react-router-dom";
import { isCodingEnabled } from "../utils/featureFlags.js";

const FOOTER_SECTIONS = [
  {
    heading: "Product",
    links: [
      { label: "Aptitude Practice", to: "/aptitude" },
      ...(isCodingEnabled() ? [{ label: "Coding Problems", to: "/coding" }] : []),
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
    links: [
      { label: "Privacy Policy (Test Version)", to: "/privacy" },
      { label: "Terms of Service", to: "/terms" },
    ],
    items: [
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
            <Logo variant="full" size="md" to="/" showTagline={true} />

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
