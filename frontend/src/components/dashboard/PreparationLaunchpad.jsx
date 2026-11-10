import React from "react";
import { Link } from "react-router-dom";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompanyIcon,
  ArrowRightIcon,
} from "../ui/Icons.jsx";
import { AnimatedNumber } from "../ui/AnimatedNumber.jsx";
import { isCodingEnabled } from "../../utils/featureFlags.js";

/**
 * PreparationLaunchpad — Compact 4-up strip (~72px height per card).
 * Displays icon, title, and stat on one line with subtitles in title/tooltip attributes.
 */
export function PreparationLaunchpad({
  preparation = null,
  targetCompaniesCount = 0,
}) {
  const apt = preparation?.aptitude || { attempted: 0, completed: 0 };
  const code = preparation?.coding || { attempted: 0, solved: 0 };
  const mock = preparation?.mockTests || { attempted: 0, completed: 0 };

  const companyStatText =
    targetCompaniesCount === 1 ? (
      "1 target"
    ) : targetCompaniesCount > 1 ? (
      <><AnimatedNumber value={targetCompaniesCount} /> targets</>
    ) : (
      "Explore tracks"
    );

  const codingEnabled = isCodingEnabled();
  const rawModules = [
    {
      title: "Aptitude",
      subtitle: "Quantitative, Logical & Verbal Aptitude",
      metric: <><AnimatedNumber value={apt.completed || 0} /> completed</>,
      to: "/aptitude",
      icon: AptitudeIcon,
    },
    {
      title: "Coding",
      subtitle: "Data Structures & Algorithmic Challenges",
      metric: <><AnimatedNumber value={code.solved || 0} /> solved</>,
      to: "/coding",
      icon: CodingIcon,
    },
    {
      title: "Mock Tests",
      subtitle: "Timed Placement Assessments",
      metric: <><AnimatedNumber value={mock.completed || 0} /> completed</>,
      to: "/mock-tests",
      icon: MockTestIcon,
    },
    {
      title: "Companies",
      subtitle: "Recruiter Tracks & Interview Roadmaps",
      metric: companyStatText,
      to: "/companies",
      icon: CompanyIcon,
    },
  ];

  const modules = rawModules.filter((m) => m.title !== "Coding" || codingEnabled);
  const gridColsClass = modules.length === 3 ? "grid-cols-1 sm:grid-cols-3 lg:grid-cols-3" : "grid-cols-2 lg:grid-cols-4";

  return (
    <section aria-label="Core preparation modules launchpad">
      <div className={`grid ${gridColsClass} gap-2.5 sm:gap-3`}>
        {modules.map((mod) => {
          const IconComponent = mod.icon;
          return (
            <Link
              key={mod.to}
              to={mod.to}
              title={`${mod.title} — ${mod.subtitle}`}
              className="h-[72px] px-3 py-2 rounded-xl bg-card border border-border shadow-xs hover:border-border/80 rr-lift flex items-center justify-between no-underline group transition-all"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg bg-primary-soft border border-border flex items-center justify-center shrink-0 text-ink transition-transform group-hover:scale-105">
                  <IconComponent className="w-4 h-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-xs sm:text-[13px] font-bold text-ink block truncate group-hover:text-ink transition-colors leading-tight">
                    {mod.title}
                  </span>
                  <span className="text-[11px] font-mono font-medium text-ink-2 block truncate mt-0.5 leading-tight">
                    {mod.metric}
                  </span>
                </div>
              </div>

              <ArrowRightIcon className="w-3.5 h-3.5 text-ink-2 group-hover:text-ink group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default PreparationLaunchpad;
