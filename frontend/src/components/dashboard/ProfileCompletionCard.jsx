import React from "react";
import { Card, CardHeader, CardContent } from "../ui/Card.jsx";
import { ProgressBar } from "../ui/ProgressBar.jsx";
import { Badge } from "../ui/Badge.jsx";
import { ProgressRing } from "../ui/ProgressRing.jsx";
import { ArrowRightIcon, ProfileIcon } from "../ui/Icons.jsx";
import { Button } from "../ui/Button.jsx";
import { calculateProfileCompletion } from "../../utils/profileCompletion.js";

/**
 * ProfileCompletionCard — Compact card calculating profile completeness from real user fields.
 * Strictly reflects actual database profile attributes.
 */
function ProfileCompletionCard({ user }) {
  if (!user) return null;

  const { percentage, completedCount, totalCount, isComplete } = calculateProfileCompletion(user);

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-3 border-b-0">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary-tint text-primary flex items-center justify-center shrink-0">
                <ProfileIcon className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Profile Readiness
              </span>
            </div>
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
          <div className="flex items-center gap-4">
            <ProgressRing value={percentage} size={68} stroke={7} tone={isComplete ? "success" : "primary"} label={`Profile ${percentage} percent complete`} />
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-slate-900">
                {isComplete ? "Profile Configured" : "Complete Your Profile"}
              </h3>
              <ProgressBar
                value={percentage}
                variant={isComplete ? "success" : "primary"}
                size="sm"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            {isComplete
              ? "Your academic details and target companies are configured to tailor your preparation."
              : "Complete your profile to personalize your preparation and unlock company-specific tracks."}
          </p>
        </CardContent>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
        <Button to="/profile" variant="outline" size="sm" fullWidth iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />} className="w-full">
            {isComplete ? "Manage Profile" : "Complete Profile"}
          </Button>
      </div>
    </Card>
  );
}

export default ProfileCompletionCard;
