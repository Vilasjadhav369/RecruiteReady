import React from "react";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { Badge } from "../ui/Badge.jsx";
import { AptitudeIcon, CodingIcon } from "../ui/Icons.jsx";

/**
 * PlacementGuidanceCard / DashboardBottomCTA — Placement season strategy and academic guidance block.
 * Purely conceptual advice without fake testimonials or synthetic numbers.
 */
function DashboardBottomCTA() {
  const guidanceTips = [
    {
      title: "Daily Cadence",
      text: "Solve 5 aptitude questions and 1 coding problem each day to retain algorithmic patterns.",
    },
    {
      title: "Timed Conditions",
      text: "Simulate real recruitment pressure by attempting mock assessments within strict time limits.",
    },
    {
      title: "Error Analysis",
      text: "Review solution explanations for every wrong answer before starting your next practice set.",
    },
  ];

  return (
    <Card className="p-6 sm:p-7 bg-white border border-slate-200/90 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="max-w-2xl space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="brand" size="sm" dot>
              Placement Season Strategy
            </Badge>
            <span className="text-xs text-slate-500 font-medium">
              Academic Best Practice
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Consistency Over Cramming: Build Systematic Placement Readiness
          </h3>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Campus recruitment evaluations prioritize problem-solving velocity, conceptual accuracy, and edge-case handling. Adopt a structured daily routine to develop sustainable confidence.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
            {guidanceTips.map((tip, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-slate-50/80 border border-slate-200/70 space-y-1"
              >
                <span className="text-xs font-semibold text-slate-900 block">
                  {tip.title}
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {tip.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0 self-start lg:self-center">
          <Button to="/aptitude" variant="primary" size="md" fullWidth iconLeft={<AptitudeIcon className="w-4 h-4 text-white" />}>
              Practice Aptitude
            </Button>
          <Button to="/coding" variant="outline" size="md" fullWidth iconLeft={<CodingIcon className="w-4 h-4 text-slate-600" />}>
              Practice Coding
            </Button>
        </div>
      </div>
    </Card>
  );
}

export default DashboardBottomCTA;
