import ProgressBar from "./ProgressBar.jsx";
import MetricCard from "./MetricCard.jsx";

/**
 * DashboardPreview — Hero section UI mockup of the student dashboard.
 *
 * IMPORTANT: All values here are VISUAL DEMO DATA for the hero illustration only.
 * They do NOT represent real students, real progress, or real backend data.
 * The actual student dashboard (Phase 4+) will use authenticated API data.
 */

const DEMO_PROGRESS = [
  { label: "Aptitude",    value: 82, color: "bg-primary" },
  { label: "Coding",      value: 71, color: "bg-emerald-600" },
  { label: "Mock Tests",  value: 60, color: "bg-amber-600" },
];

const DEMO_ACTIVITY = [
  { text: "Solved 15 Aptitude Questions", time: "2 hours ago" },
  { text: "Completed Arrays Module",       time: "6 hours ago" },
  { text: "Gave TCS Mock Test",            time: "1 day ago" },
];

const DEMO_UPCOMING = [
  { name: "Amazon Q4",     date: "16 Sep, 7:00 PM" },
  { name: "TCS Mock Test", date: "17 Sep, 6:00 PM" },
];

function DashboardPreview() {
  return (
    <div className="relative w-full max-w-[520px]" aria-hidden="true" role="presentation">
      {/* Preview label — clearly marks this as a UI mockup */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-slate-600 bg-white border border-slate-200 px-3 py-1 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          Illustrative Preview
        </span>
      </div>

      <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden select-none">
        {/* Dashboard header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 bg-background">
          <div>
            <span className="text-xs text-slate-600 block">Welcome back,</span>
            <span className="text-sm font-bold text-slate-900 block">Student</span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Keep practising. Consistency leads to success.</span>
          </div>
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">S</span>
          </div>
        </div>

        <div className="flex h-[340px]">
          {/* Sidebar */}
          <div className="w-32 border-r border-slate-200 bg-background py-3 flex-shrink-0">
            {["Dashboard", "Aptitude", "Coding", "Mock Tests", "Companies", "Study Materials", "Progress", "Profile"].map((item, i) => (
              <div
                key={item}
                className={`px-3 py-2 text-[10px] font-medium ${
                  i === 0
                    ? "text-primary bg-primary-tint border-r-2 border-primary"
                    : "text-slate-600"
                }`}
              >
                {item}
              </div>
            ))}
          </div>

          {/* Main panel */}
          <div className="flex-1 p-4 overflow-hidden">
            {/* Metric row */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <MetricCard label="Aptitude"   value="82%" change="+35% this week" positive />
              <MetricCard label="Coding"     value="71%" change="+8% this week"  positive />
              <MetricCard label="Mock Tests" value="12"  change="3 this month"   positive />
            </div>

            {/* Overall progress */}
            <div className="mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 block mb-2">
                Overall Progress
              </span>
              <div className="space-y-2.5">
                {DEMO_PROGRESS.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-slate-900 font-medium">{item.label}</span>
                      <span className="text-[10px] font-semibold text-slate-900">{item.value}%</span>
                    </div>
                    <ProgressBar value={item.value} color={item.color} size="sm" />
                  </div>
                ))}
              </div>
            </div>

            {/* Two-column bottom */}
            <div className="grid grid-cols-2 gap-3">
              {/* Recent activity */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 block mb-2">
                  Recent Activity
                </span>
                <div className="space-y-1.5">
                  {DEMO_ACTIVITY.map((a) => (
                    <div key={a.text} className="bg-background rounded-lg p-2">
                      <span className="text-[9px] font-medium text-slate-900 leading-tight block">{a.text}</span>
                      <span className="text-[8px] text-slate-400 block mt-0.5">{a.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Upcoming tests */}
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-600 block mb-2">
                  Upcoming Tests
                </span>
                <div className="space-y-1.5">
                  {DEMO_UPCOMING.map((t) => (
                    <div key={t.name} className="bg-background border border-slate-200 rounded-lg p-2 flex items-center justify-between gap-1">
                      <div className="min-w-0">
                        <span className="text-[9px] font-semibold text-slate-900 block truncate">{t.name}</span>
                        <span className="text-[8px] text-slate-400 block">{t.date}</span>
                      </div>
                      <span className="text-[8px] font-semibold text-primary bg-primary-tint px-1.5 py-0.5 rounded flex-shrink-0">
                        Register
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPreview;
