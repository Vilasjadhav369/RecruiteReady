import { Link } from "react-router-dom";
import DashboardPreview from "../components/DashboardPreview.jsx";
import StatItem from "../components/StatItem.jsx";
import FeatureCard from "../components/FeatureCard.jsx";
import Timeline from "../components/Timeline.jsx";
import CompanyGrid from "../components/CompanyGrid.jsx";
import LiveStatistics from "../components/LiveStatistics.jsx";
import StudentReviews from "../components/StudentReviews.jsx";
import CTASection from "../components/CTASection.jsx";
import SectionHeading from "../components/SectionHeading.jsx";
import ProgressBar from "../components/ProgressBar.jsx";

// ─── SVG Icons ────────────────────────────────────────────────────────────────
const AptitudeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="3" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const CodingIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M6 7.5L2 10l4 2.5M14 7.5L18 10l-4 2.5M11 5l-2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const CompanyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M6 6V4a2 2 0 012-2h4a2 2 0 012 2v2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M2 11h16" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);
const MockTestIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="5" width="14" height="11" rx="2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M7 9h6M7 12h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M7 3h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const MaterialsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M4 4h12v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2" stroke="currentColor" strokeWidth="1.5"/>
    <path d="M8 9h4M8 12h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const ProgressIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M3 15l4-4 3 3 4-5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
  </svg>
);

const FEATURES = [
  {
    icon: <AptitudeIcon />, title: "Aptitude Practice",
    description: "Timed quizzes, topic-wise question banks, instant scoring, and performance tracking to sharpen your aptitude skills.",
    linkTo: "/aptitude", linkLabel: "Practice Now",
  },
  {
    icon: <CodingIcon />, title: "Coding Practice",
    description: "Practice coding problems across difficulty levels and prepare for technical assessments at top companies.",
    linkTo: "/coding", linkLabel: "Start Solving",
  },
  {
    icon: <CompanyIcon />, title: "Company Preparation",
    description: "Explore company-specific preparation paths, past questions, interview patterns, and resources.",
    linkTo: "/companies", linkLabel: "Explore Companies",
  },
  {
    icon: <MockTestIcon />, title: "Mock Tests",
    description: "Simulate placement assessments under realistic timed conditions with detailed performance analysis.",
    linkTo: "/mock-tests", linkLabel: "Take a Test",
  },
  {
    icon: <MaterialsIcon />, title: "Study Materials",
    description: "Access structured notes, PDFs, video resources, and curated preparation guides for every topic.",
    linkTo: "/resources", linkLabel: "Browse Materials",
  },
  {
    icon: <ProgressIcon />, title: "Progress Tracking",
    description: "Understand your preparation through meaningful analytics, topic coverage, and performance trends.",
    linkTo: "/dashboard", linkLabel: "View Progress",
  },
];

// ─── STATISTICS ───────────────────────────────────────────────────────────────
// These values come from GET /api/analytics/stats (Phase 3+).
// Currently null — will display the empty "—" state.
// DO NOT hardcode production metrics here.
const PLATFORM_STATS = null;

const STAT_DEFS = [
  {
    key: "activeStudents",
    label: "Active Students",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <circle cx="7" cy="6" r="3" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M1 16c0-3.314 2.686-6 6-6s6 2.686 6 6" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="14" cy="6" r="2" stroke="#2563EB" strokeWidth="1.25"/>
        <path d="M17 16c0-2.21-1.343-4-3-4" stroke="#2563EB" strokeWidth="1.25" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "companiesCovered",
    label: "Companies Covered",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="5" width="14" height="11" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M5 5V3a2 2 0 012-2h4a2 2 0 012 2v2" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M2 10h14" stroke="#2563EB" strokeWidth="1.5"/>
      </svg>
    ),
  },
  {
    key: "practiceQuestions",
    label: "Practice Questions",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <rect x="2" y="2" width="14" height="14" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
        <path d="M6 9h6M6 12h4" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M6 6h6" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    key: "codingProblems",
    label: "Coding Problems",
    icon: (
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
        <path d="M5.5 6.5L2 9l3.5 2.5M12.5 6.5L16 9l-3.5 2.5M10 4l-2 10" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
];

// ─── ANALYTICS PREVIEW DATA ────────────────────────────────────────────────────
// UI PREVIEW ONLY — not real student data.
const PREVIEW_TOPICS = [
  { label: "Number Systems",    value: 88, color: "bg-[#2563EB]" },
  { label: "Time & Work",       value: 72, color: "bg-[#2563EB]" },
  { label: "Probability",       value: 55, color: "bg-amber-400" },
  { label: "Arrays & Strings",  value: 80, color: "bg-[#2563EB]" },
  { label: "Dynamic Programming",value: 40, color: "bg-red-400" },
];

// ─── COMPONENT: Hero ─────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="bg-white border-b border-[#D9E2EC] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Left: text content */}
          <div className="flex-1 max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-6">
              — Your placement journey starts here
            </p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#172B4D] leading-[1.1] tracking-tight mb-6">
              Prepare Smarter.<br />
              <span className="text-[#2563EB]">Get Placement Ready.</span>
            </h1>
            <p className="text-[#52606D] text-lg leading-relaxed mb-8 max-w-lg">
              One structured platform for aptitude, coding, company preparation, mock tests, study materials, and progress tracking.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-10">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-7 py-3.5 rounded-lg transition-colors duration-200 no-underline hover:no-underline"
              >
                Start Preparing
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                  <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link
                to="/#features"
                className="inline-flex items-center justify-center gap-2 text-sm font-semibold text-[#172B4D] border border-[#D9E2EC] hover:border-[#9FB3C8] bg-white px-7 py-3.5 rounded-lg transition-colors duration-200 no-underline hover:no-underline"
              >
                Explore Features
              </Link>
            </div>

            {/* Social proof — structure only, no fake numbers */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {["#2563EB", "#102A43", "#52606D", "#9FB3C8"].map((color, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  />
                ))}
              </div>
              <p className="text-sm text-[#52606D]">
                Join students actively preparing on RecruitReady
              </p>
            </div>
          </div>

          {/* Right: dashboard preview */}
          <div className="flex-1 w-full flex justify-center lg:justify-end">
            <DashboardPreview />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── COMPONENT: Stats Strip ──────────────────────────────────────────────────
function StatsStrip() {
  return (
    <section className="bg-white border-b border-[#D9E2EC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {STAT_DEFS.map((stat) => (
            <StatItem
              key={stat.key}
              label={stat.label}
              icon={stat.icon}
              value={PLATFORM_STATS?.[stat.key] ?? null}
              loading={false}
            />
          ))}
        </div>
        <p className="text-xs text-[#9FB3C8] text-center mt-8">
          Platform statistics will update in real time once the database is connected.
        </p>
      </div>
    </section>
  );
}

// ─── COMPONENT: Features ─────────────────────────────────────────────────────
function FeaturesSection() {
  return (
    <section id="features" className="bg-[#F8FAFC] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <SectionHeading
          eyebrow="Features"
          heading="Everything You Need to Prepare"
          subheading="From your first aptitude question to your final mock interview, RecruitReady keeps your preparation structured and measurable."
          className="mb-14"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── COMPONENT: How It Works ─────────────────────────────────────────────────
function HowItWorksSection() {
  return (
    <section id="how-it-works" className="bg-white py-20 px-4 border-y border-[#D9E2EC]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start">
          <div className="flex-shrink-0 lg:w-64">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-3">
              — How it works
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172B4D] leading-tight">
              A Clear Path to Placement
            </h2>
          </div>
          <div className="flex-1">
            <Timeline />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── COMPONENT: Companies ────────────────────────────────────────────────────
function CompaniesSection() {
  // companies = null until GET /api/companies is implemented (Phase 3+)
  // DO NOT hardcode company data here as production data.
  const companies = null;

  return (
    <section id="companies" className="bg-[#F8FAFC] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-2">
              — Top Companies
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172B4D] leading-tight">
              Prepare for the Companies You Want
            </h2>
            <span className="block text-[#52606D] mt-2 text-base">
              Company-specific preparation paths, past questions, and interview insights.
            </span>
          </div>
          <a
            href="/companies"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] hover:text-[#1d4ed8] no-underline hover:no-underline transition-colors flex-shrink-0"
          >
            View All Companies
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </a>
        </div>
        <CompanyGrid companies={companies} loading={false} />
      </div>
    </section>
  );
}

// ─── COMPONENT: Live Activity ────────────────────────────────────────────────
function LiveActivitySection() {
  // liveData = null until GET /api/analytics/live is implemented (Phase 3+)
  // DO NOT fabricate numbers.
  const liveData = null;

  return (
    <section id="live-activity" className="bg-white py-20 px-4 border-y border-[#D9E2EC]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-start mb-12">
          <div className="flex-shrink-0 lg:max-w-xs">
            <span className="block text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-3">
              — Live Statistics
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172B4D] leading-tight mb-4">
              Learn with a Growing Community
            </h2>
            <span className="block text-[#52606D] text-base leading-relaxed">
              Real-time data from students actively preparing on RecruitReady.
            </span>
          </div>
          <div className="flex-1 w-full">
            <LiveStatistics data={liveData} loading={false} hasError={false} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── COMPONENT: Analytics Preview ────────────────────────────────────────────
function AnalyticsPreview() {
  return (
    <section id="analytics" className="bg-[#F8FAFC] py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">

          {/* Left: heading */}
          <div className="flex-shrink-0 lg:max-w-sm">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-3">
              — Progress & Analytics
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172B4D] leading-tight mb-4">
              Know Where You Stand
            </h2>
            <p className="text-[#52606D] text-base leading-relaxed mb-6">
              Turn preparation activity into clear progress. Understand your strengths,
              identify gaps, and focus your effort where it matters most.
            </p>
            <a
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-white bg-[#2563EB] hover:bg-[#1d4ed8] px-6 py-3 rounded-lg transition-colors no-underline hover:no-underline"
            >
              View Dashboard
            </a>
          </div>

          {/* Right: analytics card UI preview */}
          {/* NOTE: All values below are VISUAL PREVIEW data only — not real student data */}
          <div className="flex-1 w-full" aria-hidden="true" role="presentation">
            <div className="relative bg-white border border-[#D9E2EC] rounded-2xl p-6 shadow-sm max-w-lg mx-auto">
              {/* Visual Preview label */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-widest text-[#52606D] bg-white border border-[#D9E2EC] px-3 py-1 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A227]" />
                  Visual Preview
                </span>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-6 pt-2">
                <div>
                  <span className="text-base font-bold text-[#172B4D] block">Preparation Overview</span>
                  <span className="text-xs text-[#9FB3C8] block mt-0.5">Example view — real data requires login</span>
                </div>
                <div className="text-xs font-medium text-[#52606D] bg-[#F8FAFC] border border-[#D9E2EC] px-3 py-1.5 rounded-full">
                  This Week
                </div>
              </div>

              {/* Overall score ring */}
              <div className="flex items-center gap-6 mb-6 p-4 bg-[#F8FAFC] rounded-xl border border-[#D9E2EC]">
                <div className="relative w-16 h-16 flex-shrink-0">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#E8F1FF" strokeWidth="8"/>
                    <circle cx="32" cy="32" r="26" fill="none" stroke="#2563EB" strokeWidth="8"
                      strokeDasharray="163" strokeDashoffset="40" strokeLinecap="round"/>
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-[#172B4D]">76%</span>
                  </div>
                </div>
                <div>
                  <span className="text-sm font-semibold text-[#172B4D] block">Overall Progress</span>
                  <span className="text-xs text-[#52606D] block mt-0.5">Across all preparation areas</span>
                </div>
              </div>

              {/* Topic breakdown */}
              <div>
                <span className="text-xs font-semibold uppercase tracking-widest text-[#52606D] block mb-4">
                  Topic Coverage
                </span>
                <div className="space-y-3">
                  {PREVIEW_TOPICS.map((topic) => (
                    <div key={topic.label}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#172B4D] font-medium">{topic.label}</span>
                        <span className="text-sm font-semibold text-[#172B4D]">{topic.value}%</span>
                      </div>
                      <ProgressBar value={topic.value} color={topic.color} size="sm" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly mini bar chart */}
              <div className="mt-6 pt-5 border-t border-[#D9E2EC]">
                <span className="text-xs font-semibold uppercase tracking-widest text-[#52606D] block mb-3">
                  Weekly Activity
                </span>
                <div className="flex items-end gap-1.5 h-12">
                  {[40, 65, 55, 80, 70, 90, 75].map((h, i) => (
                    <div
                      key={i}
                      className="flex-1 bg-[#E8F1FF] hover:bg-[#2563EB] rounded-sm transition-colors duration-150"
                      style={{ height: `${h}%` }}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <div className="flex justify-between mt-1">
                  {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                    <span key={i} className="text-[9px] text-[#9FB3C8] flex-1 text-center">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── COMPONENT: Reviews Section ───────────────────────────────────────────────
function ReviewsSection() {
  // reviews = [] until GET /api/reviews returns approved reviews (Phase 3+).
  // STRICT: Never display invented reviews. Empty array = empty state.
  const reviews = [];

  return (
    <section id="reviews" className="bg-white py-20 px-4 border-t border-[#D9E2EC]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[#2563EB] mb-2">
              — Student Reviews
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#172B4D] leading-tight">
              Real Stories. Real Success.
            </h2>
            <p className="text-[#52606D] mt-2 text-base">
              Hear from students who are on their way to great opportunities.
            </p>
          </div>
          {reviews.length > 0 && (
            <a
              href="/reviews"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#2563EB] no-underline hover:no-underline hover:text-[#1d4ed8] transition-colors flex-shrink-0"
            >
              View All Reviews
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M2 7H12M8 3L12 7L8 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          )}
        </div>
        <StudentReviews reviews={reviews} loading={false} />
      </div>
    </section>
  );
}

// ─── MAIN: HomePage ──────────────────────────────────────────────────────────
/**
 * HomePage — Full landing page for RecruitReady.
 * Composes all landing page sections in order.
 * Each section is a self-contained component.
 */
function HomePage() {
  return (
    <>
      <Hero />
      <StatsStrip />
      <FeaturesSection />
      <HowItWorksSection />
      <CompaniesSection />
      <LiveActivitySection />
      <AnalyticsPreview />
      <ReviewsSection />
      <CTASection />
    </>
  );
}

export default HomePage;
