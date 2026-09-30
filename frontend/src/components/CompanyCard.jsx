import LoadingSkeleton from "./LoadingSkeleton.jsx";

/**
 * CompanyCard — Displays a company preparation entry.
 * Architecture ready for GET /api/companies data.
 *
 * @param {Object} company - { name, industry, questionCount, difficulty }
 * @param {boolean} loading
 */
function CompanyCard({ company, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-xl p-5 space-y-3">
        <LoadingSkeleton className="h-8 w-16 rounded" />
        <LoadingSkeleton className="h-4 w-24" />
        <LoadingSkeleton className="h-3 w-20" />
      </div>
    );
  }

  if (!company) return null;

  const difficultyColors = {
    High:   "bg-red-50 text-red-600 border border-red-100",
    Medium: "bg-amber-50 text-amber-700 border border-amber-100",
    Low:    "bg-green-50 text-green-700 border border-green-100",
  };

  return (
    <div className="group bg-white border border-[#D9E2EC] rounded-xl p-5 hover:border-[#2563EB]/30 hover:shadow-sm transition-all duration-200">
      <div className="w-12 h-8 bg-[#F8FAFC] border border-[#D9E2EC] rounded flex items-center justify-center mb-3">
        <span className="text-xs font-bold text-[#172B4D]">{company.name?.slice(0, 3).toUpperCase()}</span>
      </div>
      <span className="text-sm font-bold text-[#172B4D] block mb-1">{company.name}</span>
      <span className="text-xs text-[#52606D] block mb-2">{company.industry}</span>
      <div className="flex items-center justify-between">
        {company.questionCount != null && (
          <span className="text-xs text-[#9FB3C8]">{company.questionCount}+ questions</span>
        )}
        {company.difficulty && (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${difficultyColors[company.difficulty] ?? ""}`}>
            {company.difficulty}
          </span>
        )}
      </div>
    </div>
  );
}

export default CompanyCard;
