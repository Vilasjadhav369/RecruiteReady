import React from 'react';
import { Link } from 'react-router-dom';
import LoadingSkeleton from './LoadingSkeleton.jsx';

/**
 * CompanyCard — Displays a company preparation entry with brand tokens.
 */
function CompanyCard({ company, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
        <LoadingSkeleton className="h-8 w-16 rounded" />
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-3 w-20" />
      </div>
    );
  }

  if (!company) return null;

  const initials = company.name ? company.name.slice(0, 2).toUpperCase() : 'CO';

  return (
    <Link
      to={`/companies/${company.slug || company._id || company.id}`}
      className="group block bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-xs transition-all duration-200 no-underline"
    >
      <div className="w-10 h-10 bg-[#DCFCE7] border border-[#BBF7D0] text-brand-dark rounded-lg flex items-center justify-center mb-3 font-bold text-xs">
        <span>{initials}</span>
      </div>
      <span className="text-sm font-bold text-slate-900 block mb-1 group-hover:text-brand-dark transition-colors">
        {company.name}
      </span>
      <span className="text-xs text-slate-500 block mb-2">{company.industry || 'Technology'}</span>
      {company.selectionProcess && (
        <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
          {company.selectionProcess.length} Rounds
        </span>
      )}
    </Link>
  );
}

export default CompanyCard;
