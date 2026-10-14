import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRightIcon,
  ProfileIcon,
} from "../ui/Icons.jsx";

/**
 * Maps profile completion field keys to the most specific target anchor
 * within the Student Profile page, providing direct focus for students.
 */
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
 * MissingFieldBanner — Compact, actionable dashboard setup banner for incomplete profiles.
 * 
 * Apple + Linear Design System:
 * - Rendered when required profile fields remain incomplete (< 100%).
 * - Displays human-readable field labels (never raw internal database keys).
 * - Compact horizontal chip checklist that is fully responsive on mobile.
 * - Clear, singular call-to-action linking to the profile page.
 * - Zero fabricated completion states.
 * - Completely hidden when profile is 100% complete or while loading/error.
 *
 * @param {Object} props
 * @param {Object} props.profileCompletion - Profile completion summary { percentage, missingFields, isComplete }
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

  // Determine the primary jump link based on the first missing field
  const primaryField = missing[0];
  const primaryHref = (primaryField?.key && FIELD_ANCHOR_MAP[primaryField.key]) || "/profile";

  return (
    <section
      aria-label="Profile completion checklist"
      className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 sm:p-4 shadow-2xs transition-all"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Left: Icon, Header & Checklist Chips */}
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
            <ProfileIcon className="w-4 h-4 text-amber-800" />
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xs sm:text-sm font-bold text-amber-950 tracking-tight">
                Complete Your Candidate Profile
              </h2>
              <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-200">
                {percentage}% Set Up ({missing.length} Missing)
              </span>
            </div>

            <p className="text-[11px] sm:text-xs text-amber-900/90 leading-relaxed">
              Fill in your remaining details to unlock tailored company tracks and accurate campus drive eligibility checks.
            </p>

            {/* Checklist of missing items */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5" role="list" aria-label="Missing profile fields">
              {missing.map((field) => {
                const href = FIELD_ANCHOR_MAP[field.key] || "/profile";
                return (
                  <Link
                    key={field.key}
                    to={href}
                    role="listitem"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white border border-amber-200/90 text-[11px] font-medium text-amber-950 hover:bg-amber-100/80 hover:border-amber-300 transition-colors no-underline shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" aria-hidden="true" />
                    <span>{field.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Primary Action Button */}
        <div className="shrink-0 self-start sm:self-center pt-1 sm:pt-0">
          <Link
            to={primaryHref}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-900 hover:bg-amber-950 text-white text-xs font-semibold shadow-xs transition-colors no-underline whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
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
