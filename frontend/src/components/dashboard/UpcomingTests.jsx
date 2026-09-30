import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/Card.jsx";
import { MockTestIcon, ArrowRightIcon, ClockIcon } from "../ui/Icons.jsx";
import { Badge } from "../ui/Badge.jsx";
import { Button } from "../ui/Button.jsx";

/**
 * UpcomingTests — Scheduled assessments and published mock tests card.
 * Truthful empty state when zero mock tests are currently published.
 */
function UpcomingTests({ tests = [] }) {
  const hasTests = Array.isArray(tests) && tests.length > 0;

  const getDifficultyBadge = (difficulty) => {
    const d = String(difficulty || "").toLowerCase();
    if (d === "easy") return <Badge variant="success" size="sm">Easy</Badge>;
    if (d === "hard") return <Badge variant="danger" size="sm">Hard</Badge>;
    return <Badge variant="warning" size="sm">Medium</Badge>;
  };

  return (
    <Card className="flex flex-col justify-between h-full">
      <div>
        <CardHeader className="pb-3 border-b border-slate-100">
          <div className="flex items-center justify-between w-full">
            <CardTitle>Upcoming Assessments</CardTitle>
            {hasTests && (
              <Link
                to="/mock-tests"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 no-underline"
              >
                View All
              </Link>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-3 pb-2">
          {hasTests ? (
            <div className="space-y-3">
              {tests.map((test, idx) => (
                <div
                  key={test.id || idx}
                  className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl flex items-center justify-between gap-3 hover:bg-slate-50 transition-colors"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 truncate">
                        {test.title}
                      </span>
                      {getDifficultyBadge(test.difficulty)}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                      <span>{test.durationMinutes || 60} mins</span>
                      <span>•</span>
                      <span>{test.totalQuestions || 0} questions</span>
                    </div>
                  </div>

                  <Link to="/mock-tests" className="shrink-0 no-underline">
                    <Button variant="outline" size="sm">
                      Start
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <MockTestIcon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No upcoming assessments</h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                Published assessments and placement simulation tests will appear here once scheduled.
              </p>
            </div>
          )}
        </CardContent>
      </div>

      <div className="px-5 py-3.5 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between">
        <Link to="/mock-tests" className="w-full no-underline">
          <Button
            variant="outline"
            size="sm"
            fullWidth
            iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}
          >
            Explore Mock Tests
          </Button>
        </Link>
      </div>
    </Card>
  );
}

export default UpcomingTests;
