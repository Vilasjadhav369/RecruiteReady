import React from "react";
import { Input } from "../ui/Input.jsx";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../ui/Card.jsx";

const PREPARATION_LEVELS = [
  { value: "Just Starting", label: "Level 1: Just Starting (Foundations needed)" },
  { value: "Beginner", label: "Level 2: Beginner (Basics familiar, topic practice needed)" },
  { value: "Intermediate", label: "Level 3: Intermediate (Standard DSA & aptitude)" },
  { value: "Advanced", label: "Level 4: Advanced (Targeting product companies)" },
  { value: "Placement Ready", label: "Level 5: Placement Ready (Interview & test ready)" },
];

/**
 * PersonalAcademicTab — Personal identity and verified academic background form.
 * Contains: First Name, Last Name, Email (read-only), Profile Photo URL, College, Branch,
 * Graduation Year, CGPA (0-10), and Active Backlogs (non-negative integer).
 */
export function PersonalAcademicTab({
  formData,
  errors = {},
  onChange,
  disabled = false,
  section = "all", // 'all' | 'personal' | 'academic'
}) {
  const showPersonal = section === "all" || section === "personal";
  const showAcademic = section === "all" || section === "academic";

  return (
    <div className="space-y-5">
      {/* 1. Personal Information */}
      {showPersonal && (
        <Card id="personal-section" className="border-slate-200/90 shadow-xs">
        <CardHeader>
          <div>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Official candidate identity details displayed on your placement scorecards.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="First Name"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={onChange}
              error={errors.firstName}
              required
              disabled={disabled}
              placeholder="e.g. Anand"
              helperText="Official given name."
            />

            <Input
              label="Last Name"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={onChange}
              error={errors.lastName}
              required
              disabled={disabled}
              placeholder="e.g. Kumar"
              helperText="Official surname."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Registered Email Address"
              id="email"
              name="email"
              type="email"
              value={formData.email}
              disabled
              helperText="Account email cannot be modified. Managed by identity security."
            />

            <Input
              label="Profile Photo URL"
              id="profilePhoto"
              name="profilePhoto"
              value={formData.profilePhoto}
              onChange={onChange}
              error={errors.profilePhoto}
              disabled={disabled}
              placeholder="https://example.com/avatar.jpg"
              helperText="Direct image URL for avatar preview."
            />
          </div>
        </CardContent>
      </Card>
      )}

      {/* 2. Academic Background & Campus Eligibility */}
      {showAcademic && (
        <Card id="academic-section" className="border-slate-200/90 shadow-xs">
        <CardHeader>
          <div>
            <CardTitle>Academic Credentials & Campus Eligibility</CardTitle>
            <CardDescription>
              Verified academic criteria used by company eligibility matching engines.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="College / University"
              id="college"
              name="college"
              value={formData.college}
              onChange={onChange}
              error={errors.college}
              disabled={disabled}
              placeholder="e.g. National Institute of Technology"
              helperText="Full campus institution name."
            />

            <Input
              label="Branch / Department"
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={onChange}
              error={errors.branch}
              disabled={disabled}
              placeholder="e.g. Computer Science and Engineering"
              helperText="Degree specialization."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Graduation Year"
              id="graduationYear"
              name="graduationYear"
              type="number"
              min="2000"
              max="2100"
              value={formData.graduationYear}
              onChange={onChange}
              error={errors.graduationYear}
              disabled={disabled}
              placeholder="e.g. 2026"
              helperText="Between 2000 and 2100."
            />

            <Input
              label="Cumulative CGPA (0 - 10)"
              id="cgpa"
              name="cgpa"
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.cgpa}
              onChange={onChange}
              error={errors.cgpa}
              disabled={disabled}
              placeholder="e.g. 8.75"
              helperText="Evaluated for campus drive cutoffs."
            />

            <Input
              label="Active Backlogs"
              id="backlogs"
              name="backlogs"
              type="number"
              min="0"
              step="1"
              value={formData.backlogs}
              onChange={onChange}
              error={errors.backlogs}
              disabled={disabled}
              placeholder="e.g. 0"
              helperText="Current uncleared backlogs."
            />
          </div>

          <div>
            <label
              htmlFor="preparationLevel"
              className="block text-xs font-semibold text-slate-700 tracking-tight mb-1.5"
            >
              Current Placement Preparation Level
            </label>
            <select
              id="preparationLevel"
              name="preparationLevel"
              value={formData.preparationLevel}
              onChange={onChange}
              disabled={disabled}
              aria-invalid={!!errors.preparationLevel}
              aria-describedby="prep-level-helper"
              className="w-full h-10 px-3.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">Select preparation level</option>
              {PREPARATION_LEVELS.map((lvl) => (
                <option key={lvl.value} value={lvl.value}>
                  {lvl.label}
                </option>
              ))}
            </select>
            <span id="prep-level-helper" className="text-[11px] text-slate-500 mt-1 block">
              Determines tailored placement recommendations and diagnostic assessment tracks.
            </span>
          </div>
        </CardContent>
      </Card>
      )}
    </div>
  );
}

export default PersonalAcademicTab;
