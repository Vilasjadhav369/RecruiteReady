/**
 * AdminStatCard — Reusable stat metric card for admin dashboard.
 * Supports loading, error, and dynamic values.
 */
function AdminStatCard({ title, value = 0, subtitle, icon: Icon, loading = false, error = null }) {
  if (loading) {
    return (
      <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 shadow-xs space-y-3 animate-pulse">
        <div className="flex items-center justify-between">
          <div className="w-8 h-8 bg-[#E8F1FF] rounded-lg" />
          <div className="w-12 h-4 bg-[#E8F1FF] rounded" />
        </div>
        <div className="w-16 h-7 bg-[#E8F1FF] rounded" />
        <div className="w-24 h-3 bg-[#E8F1FF] rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-5 shadow-xs">
        <span className="text-xs font-bold text-red-600 block">{title}</span>
        <span className="text-xs text-red-500 mt-1 block">Failed to load</span>
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D9E2EC] rounded-2xl p-5 shadow-xs flex flex-col justify-between hover:border-[#2563EB]/40 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-[#52606D]">
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-lg bg-[#E8F1FF] text-[#2563EB] flex items-center justify-center">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div>
        <span className="text-2xl font-bold text-[#172B4D] tracking-tight block">
          {Number(value).toLocaleString()}
        </span>
        {subtitle && (
          <span className="text-xs text-[#52606D] mt-1 block">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

export default AdminStatCard;
