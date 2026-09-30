import React from "react";
import { Link } from "react-router-dom";
import { Card } from "../ui/Card.jsx";
import { Button } from "../ui/Button.jsx";
import { AptitudeIcon, CodingIcon, ArrowRightIcon } from "../ui/Icons.jsx";

/**
 * DashboardBottomCTA — Restrained application-styled prompt to continue practicing.
 */
function DashboardBottomCTA() {
  return (
    <Card className="p-6 sm:p-7 bg-white border border-slate-200/90 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
        <div className="space-y-1">
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Ready for your next practice session?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-normal max-w-lg">
            Choose a module and keep moving forward. Consistent practice is the proven path to placement success.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link to="/aptitude" className="no-underline">
            <Button
              variant="primary"
              size="sm"
              iconLeft={<AptitudeIcon className="w-4 h-4 text-white" />}
            >
              Practice Aptitude
            </Button>
          </Link>
          <Link to="/coding" className="no-underline">
            <Button
              variant="outline"
              size="sm"
              iconLeft={<CodingIcon className="w-4 h-4 text-slate-600" />}
            >
              Practice Coding
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default DashboardBottomCTA;
