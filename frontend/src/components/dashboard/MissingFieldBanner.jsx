import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ProfileIcon,
} from "../ui/Icons.jsx";

const FIELD_ANCHOR_MAP = {
  firstName: "/profile#personal-section",
  lastName: "/profile#personal-section",
  college: "/profile#academic-section",
  branch: "/profile#academic-section",
  graduationYear: "/profile#academic-section",
  preparationLevel: "/profile#academic-section",
  targetCompanies: "/profile#target-companies-section",
  preparationGoals: "/profile#preparation-goals-section",
};

/**
 * MissingFieldBanner — Actionable setup banner with neutral outline chips.
 */
export function MissingFieldBanner({ profileCompletion = null }) {
  if (!profileCompletion) return null;

  const missing = Array.isArray(profileCompletion.missingFields)
    ? profileCompletion.missingFields
    : [];

  const percentage = typeof profileCompletion.percentage === "number"
    ? profileCompletion.percentage
    : 0;

  // Fully complete: banner does not render
  if (missing.length === 0 || percentage >= 100) {
    return null;
  }

  const primaryField = missing[0];
  const primaryHref = (primaryField?.key && FIELD_ANCHOR_MAP[primaryField.key]) || "/profile";

  return (
    <section
      aria-label="Profile completion checklist"
      className="bg-primary-soft border border-border rounded-xl p-3 sm:p-3.5 shadow-2xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Left: Icon, Header & Neutral Checklist Chips */}
        <div className="flex items-start gap-2.5 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg bg-card border border-border text-ink flex items-center justify-center shrink-0 mt-0.5">
            <ProfileIcon className="w-3.5 h-3.5 text-ink" />
          </div>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-ink tracking-tight m-0">
                Complete Your Candidate Profile
              </h2>
              <span className="text-[10px] font-bold font-mono uppercase px-1.5 py-0.5 rounded border border-border bg-card text-ink-2">
                {percentage}% ({missing.length} missing)
              </span>
            </div>

            <p className="text-[11px] text-ink-2 leading-relaxed m-0">
              Fill in remaining academic and target company details to unlock tailored preparation.
            </p>

            {/* Neutral outline chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5" role="list" aria-label="Missing profile fields">
              {missing.map((field) => {
                const href = FIELD_ANCHOR_MAP[field.key] || "/profile";
                return (
                  <Link
                    key={field.key}
                    to={href}
                    role="listitem"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-card border border-border text-[11px] font-medium text-ink hover:bg-primary-tint/60 transition-colors no-underline"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-2 shrink-0" aria-hidden="true" />
                    <span>{field.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Primary Action Button */}
        <div className="shrink-0 self-start sm:self-center">
          <Link
            to={primaryHref}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-surface text-xs font-semibold shadow-xs hover:bg-primary-hover transition-colors no-underline whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary"
          >
            <span>Complete Profile</span>
            <ArrowRightIcon className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

export default MissingFieldBanner;
