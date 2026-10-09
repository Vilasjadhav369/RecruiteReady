import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card.jsx";
import { CompanyIcon, ArrowRightIcon } from "../ui/Icons.jsx";
import { Button } from "../ui/Button.jsx";

/**
 * TargetCompanies — Displays student's actual target companies from their profile/summary.
 * Uses real MongoDB company records and logos where matched. Zero fabricated entries.
 */
function TargetCompanies({ companies = [] }) {
  const hasCompanies = Array.isArray(companies) && companies.length > 0;

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-primary-tint text-primary flex items-center justify-center shrink-0">
                <CompanyIcon className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Target Companies</CardTitle>
            </div>
            {hasCompanies && (
              <Link
                to="/profile"
                className="text-xs font-semibold text-primary hover:text-primary-dark no-underline hover:underline"
              >
                Edit Targets
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-2">
          {hasCompanies ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {companies.map((comp, idx) => {
                const name = typeof comp === "object" ? comp.name : comp;
                const logoUrl = typeof comp === "object" ? comp.logoUrl : "";
                const targetLink =
                  typeof comp === "object" && comp.id
                    ? `/companies/${comp.id}`
                    : `/companies?search=${encodeURIComponent(name)}`;

                return (
                  <Link
                    key={idx}
                    to={targetLink}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-100 transition-colors no-underline"
                  >
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt={name}
                        className="w-4 h-4 rounded object-contain shrink-0"
                      />
                    ) : (
                      <div className="w-4 h-4 rounded bg-primary-tint text-primary border border-primary-border flex items-center justify-center text-[9px] font-bold shrink-0">
                        {name?.[0]?.toUpperCase() ?? "C"}
                      </div>
                    )}
                    <span className="truncate max-w-[140px]">{name}</span>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <CompanyIcon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No target companies yet</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Add companies to personalize your preparation and prioritize company-specific questions.
              </p>
            </div>
          )}
        </CardContent>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
        <Button to="/companies" variant="outline" size="sm" fullWidth iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />} className="w-full">
          {hasCompanies ? "Explore All Companies" : "Set Target Companies"}
        </Button>
      </div>
    </Card>
  );
}

export default TargetCompanies;
