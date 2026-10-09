import React from "react";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { ArrowRightIcon } from "../ui/Icons.jsx";

/**
 * WeakAreasCard — Identifies specific areas needing attention from actual attempt data.
 * Answers: "What am I weak at?" with zero fabricated or phantom weaknesses.
 */
export function WeakAreasCard({ weakAreas = null }) {
  const items = weakAreas?.items || [];
  const message = weakAreas?.message || "Complete more practice to identify your weak areas.";

  return (
    <Card className="p-5 sm:p-6 bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between h-full">
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
            Needs Attention
          </span>
          <span className="text-xs text-slate-400 font-medium">
            {items.length > 0 ? `${items.length} Focus Areas` : "No Critical Gaps"}
          </span>
        </div>

        <h3 className="text-base font-bold text-slate-900">
          Targeted Skill Improvement
        </h3>

        {items.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed">
            {message}
          </div>
        ) : (
          <div className="space-y-2.5">
            {items.map((item, idx) => (
              <div
                key={idx}
                className="p-3 bg-slate-50 border border-slate-200/90 rounded-lg flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate">
                      {item.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 uppercase">
                      {item.type}
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-amber-700 block mt-0.5">
                    {item.metric}
                  </span>
                </div>

                <Button
                  to={item.actionLink || "/aptitude"}
                  variant="outline"
                  size="sm"
                  className="shrink-0 text-xs py-1 px-2.5"
                >
                  {item.actionText || "Practice"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-4 mt-2">
        <Button to="/aptitude" variant="outline" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
          Browse Topic Practice
        </Button>
      </div>
    </Card>
  );
}

export default WeakAreasCard;
