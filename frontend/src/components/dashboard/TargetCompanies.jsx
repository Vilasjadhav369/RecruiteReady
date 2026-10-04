import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card.jsx";
import { CompanyIcon, ArrowRightIcon } from "../ui/Icons.jsx";
import { Button } from "../ui/Button.jsx";

/**
 * TargetCompanies — Displays student's actual target companies from their profile.
 * Zero fabricated company entries.
 */
function TargetCompanies({ companies = [] }) {
  const hasCompanies = Array.isArray(companies) && companies.length > 0;

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#DCFCE7] text-[#166534] flex items-center justify-center shrink-0">
                <CompanyIcon className="w-3.5 h-3.5" />
              </div>
              <CardTitle>Target Companies</CardTitle>
            </div>
            {hasCompanies && (
              <Link
                to="/profile"
                className="text-xs font-semibold text-[#166534] hover:text-[#14532D] no-underline hover:underline"
              >
                Edit Targets
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-2">
          {hasCompanies ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {companies.map((company, idx) => (
                <Link
                  key={idx}
                  to={`/companies?search=${encodeURIComponent(company)}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:border-slate-300 hover:bg-slate-100 transition-colors no-underline"
                >
                  <div className="w-5 h-5 rounded bg-[#DCFCE7] text-[#166534] border border-[#BBF7D0] flex items-center justify-center text-[10px] font-bold shrink-0">
                    {company[0]?.toUpperCase() ?? "C"}
                  </div>
                  <span className="truncate max-w-[140px]">{company}</span>
                </Link>
              ))}
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
        <Link to="/companies" className="w-full no-underline">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
          >
            {hasCompanies ? "Explore Companies" : "Set Target Companies"}
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default TargetCompanies;
