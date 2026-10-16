import CompanyCard from "./CompanyCard.jsx";
import EmptyState from "./EmptyState.jsx";

/**
 * CompanyGrid — Grid of CompanyCards.
 * Architecture ready for GET /api/companies.
 *
 * @param {Array|null} companies - Array of company objects from API, or null when not loaded
 * @param {boolean} loading
 */
function CompanyGrid({ companies = null, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <CompanyCard key={i} loading />
        ))}
      </div>
    );
  }

  if (!companies || companies.length === 0) {
    return (
      <div className="bg-white border border-dashed border-slate-200 rounded-xl py-16">
        <EmptyState
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <rect x="2" y="5" width="16" height="12" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
              <path d="M5 5V3a2 2 0 012-2h6a2 2 0 012 2v2M2 10h16" stroke="#2563EB" strokeWidth="1.5"/>
            </svg>
          }
          title="No companies available"
          description="Explore available target companies to begin company-specific placement preparation."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {companies.map((company) => (
        <CompanyCard key={company._id ?? company.id} company={company} />
      ))}
    </div>
  );
}

export default CompanyGrid;
