import React from "react";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { ArrowRightIcon } from "../ui/Icons.jsx";

/**
 * PlacementReadinessCard — Transparent, data-driven readiness calculation.
 * Never displays fake percentages. Strictly calculates from real activity metrics.
 */
export function PlacementReadinessCard({ readiness = null }) {
  if (!readiness || readiness.score === null || readiness.status === "insufficient_data") {
    return (
      <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
              Placement Readiness
            </span>
            <span className="text-xs font-semibold text-slate-400">
              Awaiting Activity Data
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-900">
            Readiness Score Pending
          </h3>

          <p className="text-xs text-slate-600 leading-relaxed">
            {readiness?.message || "Complete more practice activities to calculate your placement readiness."}
          </p>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-500 space-y-1">
            <div className="font-semibold text-slate-700">Transparent Calculation Model:</div>
            <div>• Aptitude Accuracy (max 30 pts)</div>
            <div>• Coding Problems Solved (max 30 pts)</div>
            <div>• Timed Mock Test Performance (max 25 pts)</div>
            <div>• Profile & Target Definition (max 15 pts)</div>
          </div>
        </div>

        <div className="pt-4 mt-2">
          <Button to="/aptitude" variant="outline" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
            Start First Practice Session
          </Button>
        </div>
      </Card>
    );
  }

  const { score, status, message, breakdown } = readiness;

  const getStatusBadge = () => {
    switch (status) {
      case "placement_ready":
        return { text: "Placement Ready", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
      case "progressing":
        return { text: "Progressing", color: "text-blue-700 bg-blue-50 border-blue-200" };
      default:
        return { text: "Building Foundations", color: "text-amber-700 bg-amber-50 border-amber-200" };
    }
  };

  const badge = getStatusBadge();

  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Placement Readiness
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.text}
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-mono">
            {score}
          </span>
          <span className="text-sm text-slate-400 font-medium">/ 100</span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          {message}
        </p>

        {breakdown && (
          <div className="space-y-2 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              {isCodingEnabled() && <span>Coding ({breakdown.codingScore}/30)</span>}
              <span>Aptitude ({breakdown.aptitudeScore}/30)</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-600">
              <span>Mock Tests ({breakdown.mockTestScore}/25)</span>
              <span>Profile ({breakdown.profileScore}/15)</span>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 mt-2">
        <Button to="/progress" variant="outline" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
          View Detailed Analytics
        </Button>
      </div>
    </Card>
  );
}

export default PlacementReadinessCard;
