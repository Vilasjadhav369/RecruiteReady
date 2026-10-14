import React from "react";
import { Avatar } from "../ui/Avatar.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card.jsx";
import { ProgressBar } from "../ui/ProgressBar.jsx";
import {
  AcademicCapIcon,
  CompanyIcon,
  ShieldCheckIcon,
  CalendarIcon,
  CheckIcon,
} from "../ui/Icons.jsx";

/**
 * ProfileIdentitySidebar — Dedicated candidate summary card & profile readiness indicator.
 * Displays official academic credentials, enrollment timestamp, and transparent completion breakdown.
 */
export function ProfileIdentitySidebar({
  user,
  formData,
  completion,
}) {
  const studentFullName = `${formData?.firstName || user?.firstName || "Student"} ${formData?.lastName || user?.lastName || ""}`.trim();
  const registrationDate = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Active Candidate";

  return (
    <div className="space-y-5">
      {/* 1. Identity Overview Card */}
      <Card className="border-slate-200/90 shadow-xs">
        <CardContent className="p-5 sm:p-6 text-center space-y-4">
          <div className="flex justify-center">
            <Avatar
              size="xl"
              name={studentFullName}
              src={formData?.profilePhoto || user?.profilePhoto || undefined}
              className="w-16 h-16 text-lg ring-4 ring-slate-100"
            />
          </div>

          <div className="space-y-1">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              {studentFullName}
            </h2>
            <p className="text-xs text-slate-500 font-medium font-mono truncate">
              {user?.email || "student@recruitready.in"}
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <Badge variant="primary">
              {user?.role === "admin" ? "Administrator" : "Candidate"}
            </Badge>
            <Badge variant="success" dot>
              Active Account
            </Badge>
            {formData?.preparationLevel && (
              <Badge variant="neutral">
                {formData.preparationLevel}
              </Badge>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 text-left space-y-2.5 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <AcademicCapIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">
                {formData?.college || user?.college || "College not set"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600">
              <CompanyIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">
                {formData?.branch || user?.branch || "Department not set"}
              </span>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600">
              <CalendarIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span>
                {formData?.graduationYear || user?.graduationYear
                  ? `Batch of ${formData?.graduationYear || user?.graduationYear}`
                  : "Graduation year not set"}
              </span>
            </div>

            {(formData?.cgpa !== "" && formData?.cgpa !== null && formData?.cgpa !== undefined) && (
              <div className="flex items-center justify-between text-slate-600 pt-1 border-t border-slate-100/80">
                <span className="text-slate-500">Current CGPA</span>
                <span className="font-mono font-bold text-slate-900">{formData.cgpa} / 10</span>
              </div>
            )}

            {(formData?.backlogs !== "" && formData?.backlogs !== null && formData?.backlogs !== undefined) && (
              <div className="flex items-center justify-between text-slate-600">
                <span className="text-slate-500">Active Backlogs</span>
                <span className={`font-mono font-bold ${Number(formData.backlogs) === 0 ? "text-emerald-700" : "text-amber-700"}`}>
                  {formData.backlogs}
                </span>
              </div>
            )}

            <div className="flex items-center gap-2.5 text-slate-400 pt-1 text-[11px]">
              <ShieldCheckIcon className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Registered: {registrationDate}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Profile Readiness Card */}
      {completion && (
        <Card className="border-slate-200/90 shadow-xs">
          <CardHeader className="pb-3 border-b border-slate-100 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold">Profile Readiness</CardTitle>
              <p className="text-[11px] text-slate-500">
                {completion.completedCount} of {completion.totalCount} details completed
              </p>
            </div>
            <span className="text-sm font-bold text-primary font-mono">
              {completion.percentage}%
            </span>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-3.5">
            <ProgressBar
              value={completion.percentage}
              max={100}
              variant={completion.isComplete ? "success" : "primary"}
              size="md"
            />

            <div className="space-y-1.5 text-xs">
              {completion.fields.map((f) => (
                <div
                  key={f.key}
                  className="flex items-center justify-between text-slate-600 py-0.5"
                >
                  <span className="flex items-center gap-2 truncate pr-2">
                    {f.completed ? (
                      <span className="w-4 h-4 rounded-full bg-primary-tint text-primary flex items-center justify-center shrink-0">
                        <CheckIcon className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      <span className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                    )}
                    <span className={`truncate ${f.completed ? "text-slate-800 font-medium" : "text-slate-500"}`}>
                      {f.label}
                    </span>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-mono">
                    <span className="text-slate-400">+{f.weight}%</span>
                    <span className={f.completed ? "text-emerald-600 font-medium" : "text-slate-400"}>
                      {f.completed ? "Done" : "Pending"}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed pt-2 border-t border-slate-100">
              {completion.isComplete
                ? "Your candidate profile is 100% complete. Company eligibility engines and tailored roadmaps are fully configured."
                : "Fill in all academic and personal details to ensure accurate campus drive eligibility."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProfileIdentitySidebar;
