import React from "react";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { ArrowRightIcon } from "../ui/Icons.jsx";

/**
 * RecommendationCard — Today's personalized recommendation.
 * Answers: "What should I practice today?" based on deterministic rule priority:
 * 1. Unfinished assessment
 * 2. Weak/low-activity area
 * 3. Target company preparation
 * 4. Incomplete profile
 * 5. Daily consistency practice
 */
export function RecommendationCard({ recommendation = null }) {
  if (!recommendation) {
    return (
      <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs">
        <div className="space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Today's Recommendation
          </span>
          <h3 className="text-sm font-bold text-slate-900">
            No active recommendation
          </h3>
          <p className="text-xs text-slate-500">
            Complete your profile and practice modules to receive tailored guidance.
          </p>
          <div className="pt-2">
            <Button to="/profile" variant="outline" size="sm">
              Complete Profile
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  const getBadge = () => {
    switch (recommendation.priority) {
      case 1:
        return { text: "High Priority", color: "text-amber-700 bg-amber-50 border-amber-200" };
      case 2:
        return { text: "Skill Focus", color: "text-blue-700 bg-blue-50 border-blue-200" };
      case 3:
        return { text: "Company Prep", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      default:
        return { text: "Daily Step", color: "text-primary bg-primary-tint border-primary-border" };
    }
  };

  const badge = getBadge();

  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Your Next Step
            </span>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}
            >
              {badge.text}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900">
            {recommendation.title}
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            {recommendation.description}
          </p>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          <Button
            to={recommendation.actionLink || "/aptitude"}
            variant="primary"
            size="md"
            iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
          >
            {recommendation.actionText || "Get Started"}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default RecommendationCard;
