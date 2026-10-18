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

/**
 * PreparationLaunchpad — Unified preparation launchpad with integrated metrics.
 * Linear-style minimalism + Apple density:
 * - Single clear launchpad for all 4 core preparation modules.
 * - Eliminates duplicate launchpad pills + separate stat cards.
 * - Displays genuine metrics directly on each module card.
 */
export function PreparationLaunchpad({
  preparation = null,
  targetCompaniesCount = 0,
}) {
  const apt = preparation?.aptitude || { attempted: 0, completed: 0 };
  const code = preparation?.coding || { attempted: 0, solved: 0 };
  const mock = preparation?.mockTests || { attempted: 0, completed: 0 };

  const modules = [
    {
      title: "Aptitude",
      subtitle: "Quant, Logical, Verbal",
      metric: <><AnimatedNumber value={apt.completed || 0} /> completed</>,
      secondaryMetric: apt.attempted > 0 ? `${apt.attempted} attempts` : null,
      to: "/aptitude",
      icon: AptitudeIcon,
      accent: "hover:border-slate-300 hover:bg-slate-50/30",
      iconColor: "text-slate-600 bg-slate-50 border-slate-200",
    },
    {
      title: "Coding",
      subtitle: "DSA, Algorithms",
      metric: <><AnimatedNumber value={code.solved || 0} /> solved</>,
      secondaryMetric: code.attempted > 0 ? `${code.attempted} attempted` : null,
      to: "/coding",
      icon: CodingIcon,
      accent: "hover:border-slate-300 hover:bg-slate-50/30",
      iconColor: "text-slate-600 bg-slate-50 border-slate-200",
    },
    {
      title: "Mock Tests",
      subtitle: "Timed hiring exams",
      metric: <><AnimatedNumber value={mock.completed || 0} /> completed</>,
      secondaryMetric: mock.attempted > 0 ? `${mock.attempted} taken` : null,
      to: "/mock-tests",
      icon: MockTestIcon,
      accent: "hover:border-slate-300 hover:bg-slate-50/30",
      iconColor: "text-slate-600 bg-slate-50 border-slate-200",
    },
    {
      title: "Companies",
      subtitle: "Target tracks & patterns",
      metric: targetCompaniesCount > 0 ? <><AnimatedNumber value={targetCompaniesCount} /> targets</> : "Explore tracks",
      secondaryMetric: null,
      to: "/companies",
      icon: CompanyIcon,
      accent: "hover:border-slate-300 hover:bg-slate-50/30",
      iconColor: "text-slate-600 bg-slate-50 border-slate-200",
    },
  ];

  return (
    <section aria-label="Core preparation modules launchpad" className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Preparation Modules
        </h2>
      </div>

      <div className="rr-stagger grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
        {modules.map((mod) => {
          const IconComponent = mod.icon;
          return (
            <Link
              key={mod.to}
              to={mod.to}
              className={`group flex flex-col justify-between p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/90 shadow-xs hover:shadow-sm rr-lift no-underline ${mod.accent}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${mod.iconColor}`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
                <ArrowRightIcon className="w-3.5 h-3.5 text-slate-300 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </div>

              <div className="min-w-0 mt-1.5">
                <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate block">
                  {mod.title}
                </span>
                <span className="text-[11px] text-slate-500 block truncate leading-tight mt-0.5">
                  {mod.subtitle}
                </span>
                <div className="mt-1.5 pt-1 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700 font-mono">
                    {mod.metric}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default PreparationLaunchpad;
