import React from "react";
import { Link } from "react-router-dom";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompanyIcon,
  ArrowRightIcon,
} from "../ui/Icons.jsx";

const DOMAINS = [
  {
    title: "Aptitude",
    subtitle: "Quant, Logical, Verbal",
    to: "/aptitude",
    icon: AptitudeIcon,
    accent: "group-hover:border-blue-400 group-hover:bg-blue-50/50",
    iconColor: "text-blue-600 bg-blue-50 border-blue-200",
  },
  {
    title: "Coding",
    subtitle: "DSA, Algorithms",
    to: "/coding",
    icon: CodingIcon,
    accent: "group-hover:border-emerald-400 group-hover:bg-emerald-50/50",
    iconColor: "text-emerald-600 bg-emerald-50 border-emerald-200",
  },
  {
    title: "Mock Tests",
    subtitle: "Timed hiring exams",
    to: "/mock-tests",
    icon: MockTestIcon,
    accent: "group-hover:border-amber-400 group-hover:bg-amber-50/50",
    iconColor: "text-amber-600 bg-amber-50 border-amber-200",
  },
  {
    title: "Companies",
    subtitle: "Target tracks & patterns",
    to: "/companies",
    icon: CompanyIcon,
    accent: "group-hover:border-purple-400 group-hover:bg-purple-50/50",
    iconColor: "text-purple-600 bg-purple-50 border-purple-200",
  },
];

/**
 * PreparationDomainPills — High-efficiency, compact launchpad cards for the 4 core practice modules.
 * Linear-style minimalism: Replaces oversized 4-card grids with sleek, space-saving modules.
 */
export function PreparationDomainPills() {
  return (
    <section aria-label="Core preparation modules" className="space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Core Preparation Modules
        </h2>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {DOMAINS.map((domain) => {
          const IconComponent = domain.icon;
          return (
            <Link
              key={domain.to}
              to={domain.to}
              className={`group flex items-center gap-3 p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm transition-all duration-150 no-underline ${domain.accent}`}
            >
              <div
                className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${domain.iconColor}`}
              >
                <IconComponent className="w-4 h-4" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                    {domain.title}
                  </span>
                  <ArrowRightIcon className="w-3 h-3 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 hidden sm:inline" />
                </div>
                <span className="text-[11px] text-slate-500 block truncate leading-tight">
                  {domain.subtitle}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default PreparationDomainPills;
