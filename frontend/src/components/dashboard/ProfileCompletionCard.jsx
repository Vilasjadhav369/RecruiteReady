import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card.jsx";
import { ProgressBar } from "../ui/ProgressBar.jsx";
import { Badge } from "../ui/Badge.jsx";
import { ArrowRightIcon, CheckIcon } from "../ui/Icons.jsx";
import { Button } from "../ui/Button.jsx";

/**
 * ProfileCompletionCard — Compact card calculating profile completeness from real user fields.
 * Strictly reflects actual database profile attributes.
 */
function ProfileCompletionCard({ user }) {
  if (!user) return null;

  const fields = [
    { label: "First Name", completed: Boolean(user.firstName?.trim()) },
    { label: "Last Name", completed: Boolean(user.lastName?.trim()) },
    { label: "Email", completed: Boolean(user.email?.trim()) },
    { label: "College", completed: Boolean(user.college?.trim()) },
    { label: "Branch", completed: Boolean(user.branch?.trim()) },
    { label: "Graduation Year", completed: Boolean(user.graduationYear) },
    { label: "Target Companies", completed: Array.isArray(user.targetCompanies) && user.targetCompanies.length > 0 },
  ];

  const completedCount = fields.filter((f) => f.completed).length;
  const totalCount = fields.length;
  const percentage = Math.round((completedCount / totalCount) * 100);
  const isComplete = percentage === 100;

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-3 border-b-0">
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Profile
            </span>
            <Badge
              variant={isComplete ? "success" : "primary"}
              size="sm"
              dot={isComplete}
            >
              {isComplete ? "Complete" : `${completedCount}/${totalCount} fields`}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-0 pb-4 space-y-3">
          <div>
            <div className="flex items-baseline justify-between mb-1.5">
              <h3 className="text-sm font-semibold text-slate-900">
                {isComplete ? "Profile Configured" : "Complete Your Profile"}
              </h3>
              <span className="text-sm font-bold text-slate-900 font-mono">
                {percentage}%
              </span>
            </div>

            <ProgressBar
              value={percentage}
              variant={isComplete ? "success" : "primary"}
              size="sm"
            />
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {isComplete
              ? "Your academic details and target companies are configured to tailor your preparation."
              : "Complete your profile to personalize your preparation and unlock company-specific tracks."}
          </p>
        </CardContent>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
        <Link to="/profile" className="w-full no-underline">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
          >
            {isComplete ? "Manage Profile" : "Complete Profile"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default ProfileCompletionCard;
