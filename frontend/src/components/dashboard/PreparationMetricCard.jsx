import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "../ui/Icons.jsx";
import { Card } from "../ui/Card.jsx";

/**
 * PreparationMetricCard — Displays domain metrics with real counts and honest empty states.
 */
function PreparationMetricCard({
  title,
  icon: Icon,
  attempted = 0,
  completed = 0,
  unit = "questions",
  to = "/dashboard",
  emptyMessage = "No activity yet",
}) {
  const hasActivity = attempted > 0 || completed > 0;

  return (
    <Card hoverable className="p-4 sm:p-5 flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-150">
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100/80 px-2 py-0.5 rounded-full border border-slate-200/60">
            {hasActivity ? `${attempted} Attempted` : "Not Started"}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
          {title}
        </h3>

        {hasActivity ? (
          <div className="mt-2.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold text-slate-900 font-mono tracking-tight">
                {completed.toLocaleString()}
              </span>
              <span className="text-xs text-slate-500">
                {unit} completed
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            {emptyMessage}
          </p>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
        <Link
          to={to}
          className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline group-hover:underline"
        >
          <span>{hasActivity ? "Continue Practice" : "Start Practicing"}</span>
          <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </Card>
  );
}

export default PreparationMetricCard;
