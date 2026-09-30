import React from "react";
import { Link } from "react-router-dom";
import { ArrowRightIcon } from "../ui/Icons.jsx";
import { Card } from "../ui/Card.jsx";

/**
 * QuickActionCard — Interactive module action card with subtle hover elevation.
 */
function QuickActionCard({ title, description, icon: Icon, to }) {
  return (
    <Link to={to} className="group no-underline block h-full">
      <Card
        hoverable
        className="p-5 flex flex-col justify-between h-full group-hover:border-blue-500/40 group-hover:shadow-xs transition-all duration-150"
      >
        <div>
          <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-600 text-slate-700 group-hover:text-white flex items-center justify-center transition-colors duration-150 mb-3.5">
            <Icon className="w-5 h-5" />
          </div>

          <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors mb-1">
            {title}
          </h3>

          <p className="text-xs text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
          <span>Start Module</span>
          <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </div>
      </Card>
    </Link>
  );
}

export default QuickActionCard;
