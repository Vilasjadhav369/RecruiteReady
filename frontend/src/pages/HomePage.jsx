import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import companyService from "../services/companyService.js";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompanyIcon,
  ResourcesIcon,
  ProgressIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
} from "../components/ui/Icons.jsx";

const PREPARATION_GOALS = [
  {
    icon: AptitudeIcon,
    title: "Aptitude Practice",
    description: "Quantitative, logical, and verbal problem sets with topic-wise filtering and detailed solution steps.",
    to: "/aptitude",
    accent: "Quantitative & Logic",
  },
  {
    icon: CodingIcon,
    title: "Coding Practice",
    description: "Curated programming challenges across data structures and algorithms with real-time test execution.",
    to: "/coding",
    accent: "DSA & Problem Solving",
  },
  {
    icon: MockTestIcon,
    title: "Mock Assessments",
    description: "Timed placement simulations mirroring actual company test environments and scoring criteria.",
    to: "/mock-tests",
    accent: "Timed Simulations",
  },
  {
    icon: CompanyIcon,
    title: "Company Preparation",
    description: "Company-specific question archives, hiring round patterns, and eligibility breakdowns.",
    to: "/companies",
    accent: "Interview Patterns",
  },
  {
    icon: ResourcesIcon,
    title: "Study Resources",
    description: "Handpicked documentation, technical revision sheets, and core CS fundamentals materials.",
    to: "/resources",
    accent: "Notes & Guides",
  },
  {
    icon: ProgressIcon,
    title: "Progress Analytics",
    description: "Comprehensive preparation metrics, accuracy trends, and module completion tracking.",
    to: "/progress",
    accent: "Metrics & Growth",
  },
];

const WORKFLOW_STEPS = [
  {
    step: "01",
    title: "Create Your Profile",
    description: "Set up your student profile with your college, stream, and graduation year to personalize your prep path.",
  },
  {
    step: "02",
    title: "Structured Practice",
    description: "Solve daily aptitude questions and algorithm challenges organized progressively by topic and difficulty.",
  },
  {
    step: "03",
    title: "Evaluate with Mocks",
    description: "Attempt full-length timed mock tests to identify weak areas and build assessment stamina.",
  },
  {
    step: "04",
    title: "Target Company Rounds",
    description: "Review specific hiring tracks and interview questions for visiting on-campus and off-campus recruiters.",
  },
];

const ROADMAP_STAGES = [
  { stage: "Phase 1", name: "Foundation", detail: "Aptitude core + programming syntax" },
  { stage: "Phase 2", name: "Practice", detail: "DSA patterns + logical reasoning" },
  { stage: "Phase 3", name: "Assessment", detail: "Timed mock tests & accuracy drills" },
  { stage: "Phase 4", name: "Company Prep", detail: "Interview archives & recruitment tracks" },
  { stage: "Phase 5", name: "Interview Ready", detail: "Confidence & technical mastery" },
];

const BENEFIT_ITEMS = [
  {
    title: "Centralized Preparation",
    description: "A single unified portal covering aptitude, coding, mock tests, and company dossiers without fragmented bookmarks.",
  },
  {
    title: "Structured Practice",
    description: "Clear categorizations and difficulty levels designed to transition students from basics to complex problem solving.",
  },
  {
    title: "Real Progress Tracking",
    description: "Every attempt, submission, and test score updates your authentic dashboard with zero simulated or fake metrics.",
  },
  {
    title: "Company-Focused Prep",
    description: "Review real round structures, common questions, and domain specifications for premier recruiters.",
  },
  {
    title: "Curated Study Materials",
    description: "Direct access to high-yield technical notes, algorithms cheatsheets, and interview cheat sheets.",
  },
  {
    title: "Admin-Managed Catalog",
    description: "Placement cells and faculty administrators continuously curate, verify, and update test sets and problems.",
  },
];

function HomePage() {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadCompanies() {
      try {
        const data = await companyService.getCompanies({ limit: 6 });
        if (isMounted) {
          const list = Array.isArray(data) ? data : data?.companies || [];
          setCompanies(list.slice(0, 6));
        }
      } catch (err) {
        if (isMounted) setCompanies([]);
      } finally {
        if (isMounted) setCompaniesLoading(false);
      }
    }
    loadCompanies();
    return () => {
      isMounted = false;
    };
  }, []);

  const primaryActionTo = isAuthenticated ? "/dashboard" : "/register";
  const primaryActionLabel = isAuthenticated ? "Go to Dashboard" : "Start Preparing";

  return (
    <div className="space-y-20 sm:space-y-28 pb-16">

      {/* ── SECTION 1: HERO ─────────────────────────────────── */}
      <section className="relative pt-8 sm:pt-14 lg:pt-18 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2">
              <Badge variant="brand" size="md">
                Campus Placement Portal
              </Badge>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Academic Year 2025–2026
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-slate-900 tracking-tight leading-[1.15]">
              Prepare Smarter. <br />
              <span className="text-[#166534]">Get Placement Ready.</span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl leading-relaxed">
              RecruitReady centralizes your placement journey into a structured workflow. Master aptitude modules, tackle algorithmic coding challenges, simulate real assessment rounds, and study company-specific interview patterns.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link to={primaryActionTo} className="no-underline">
                <Button variant="primary" size="lg" fullWidth iconRight={<ArrowRightIcon className="w-4 h-4" />}>
                  {primaryActionLabel}
                </Button>
              </Link>
              <Link to="/companies" className="no-underline">
                <Button variant="outline" size="lg" fullWidth>
                  Explore Platform
                </Button>
              </Link>
            </div>

            <div className="pt-4 flex items-center gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-[#166534]" />
                Zero Fake Data
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-[#166534]" />
                Real Timed Assessments
              </span>
              <span className="flex items-center gap-1.5">
                <CheckIcon className="w-4 h-4 text-[#166534]" />
                Company Specific
              </span>
            </div>
          </div>

          {/* Right Column: Abstract Placement Journey Visual */}
          <div className="lg:col-span-5 w-full">
            <div className="relative bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#22C55E]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    The Placement Journey
                  </span>
                </div>
                <span className="text-[11px] font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Systematic Roadmap
                </span>
              </div>

              {/* Journey Stepper */}
              <div className="py-5 space-y-3.5">
                {[
                  { title: "Aptitude Mastery", desc: "Quants, Logical & Verbal Reasoning", tag: "Step 1", active: true },
                  { title: "Coding Challenges", desc: "Data Structures & Core Algorithms", tag: "Step 2", active: true },
                  { title: "Mock Assessments", desc: "Timed Sectional & Full Tests", tag: "Step 3", active: true },
                  { title: "Company Tracks", desc: "Hiring Rounds & Past Question Sets", tag: "Step 4", active: true },
                  { title: "Final Placement", desc: "Campus Offers & Technical Interviews", tag: "Goal", isGoal: true },
                ].map((item, idx) => (
                  <div
                    key={item.title}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      item.isGoal
                        ? "bg-[#F0FDF4] border-[#BBF7D0]"
                        : "bg-slate-50/70 border-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          item.isGoal
                            ? "bg-[#166534] text-white"
                            : "bg-white border border-slate-200 text-slate-700 font-mono"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div>
                        <span className={`text-xs font-semibold block ${item.isGoal ? "text-[#14532D]" : "text-slate-900"}`}>
                          {item.title}
                        </span>
                        <span className="text-[11px] text-slate-500 block">
                          {item.desc}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        item.isGoal
                          ? "bg-[#DCFCE7] text-[#14532D]"
                          : "bg-white text-slate-600 border border-slate-200"
                      }`}
                    >
                      {item.tag}
                    </span>
                  </div>
                ))}
              </div>

              {/* Today's Prep Insight Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                <span className="font-medium text-slate-700">Daily Focus:</span>
                <span className="text-[#166534] font-semibold bg-[#DCFCE7] px-2 py-0.5 rounded">
                  Consistent Revision
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ── SECTION 2: PREPARATION GOALS ───────────────────── */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <Badge variant="brand" size="sm" className="mb-3">
            Core Modules
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Everything You Need to Prepare
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2.5 leading-relaxed">
            Targeted preparation tracks engineered specifically for campus recruitment workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PREPARATION_GOALS.map((goal) => {
            const Icon = goal.icon;
            return (
              <Card
                key={goal.title}
                hoverable
                className="p-6 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7] flex items-center justify-center shrink-0 group-hover:bg-[#166534] group-hover:text-white transition-colors duration-150">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {goal.accent}
                    </span>
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-[#166534] transition-colors mb-2">
                    {goal.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {goal.description}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={goal.to}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#166534] group-hover:text-[#14532D] no-underline"
                  >
                    <span>Open Module</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── SECTION 3: TOP COMPANIES ───────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 pb-4 border-b border-slate-200 gap-4">
          <div>
            <Badge variant="neutral" size="sm" className="mb-2">
              Recruiter Dossiers
            </Badge>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Company Preparation
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Real company hiring patterns and syllabus tracks from the database.
            </p>
          </div>
          <Link to="/companies" className="no-underline shrink-0">
            <Button variant="outline" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />}>
              View All Companies
            </Button>
          </Link>
        </div>

        {companiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {companies.map((company) => (
              <Card
                key={company._id || company.id || company.name}
                hoverable
                className="p-5 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                        <CompanyIcon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900 group-hover:text-[#166534] transition-colors">
                          {company.name}
                        </h4>
                        {company.industry && (
                          <span className="text-[11px] text-slate-500 block">
                            {company.industry}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {company.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {company.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    {company.packageRange || "Hiring Archive"}
                  </span>
                  <Link
                    to={`/companies/${company._id || company.id}`}
                    className="font-semibold text-[#166534] inline-flex items-center gap-1 no-underline group-hover:underline"
                  >
                    <span>View Rounds</span>
                    <ChevronRightIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 bg-white border border-slate-200 rounded-xl">
            <CompanyIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              No companies available yet.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Administrator-curated company recruitment profiles will appear here as they are published.
            </p>
          </div>
        )}
      </section>

      {/* ── SECTION 4: HOW IT WORKS ────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <Badge variant="brand" size="sm" className="mb-3">
            Workflow
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            How RecruitReady Works
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            A clear four-step discipline designed for student placement preparation.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {WORKFLOW_STEPS.map((item) => (
            <div
              key={item.step}
              className="bg-white border border-slate-200 rounded-xl p-6 relative hover:border-slate-300 transition-colors"
            >
              <span className="text-2xl sm:text-3xl font-bold font-mono text-[#166534] block mb-3">
                {item.step}
              </span>
              <h3 className="text-base font-semibold text-slate-900 mb-2">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 5: PLACEMENT ROADMAP ───────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-10">
          <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#166534] block mb-1">
              Curriculum Roadmap
            </span>
            <h2 className="text-xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Progression From Basics to Offers
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1.5">
              Follow a phased sequence that reinforces concepts before pressure testing.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {ROADMAP_STAGES.map((stg, i) => (
              <div
                key={stg.name}
                className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold text-[#166534] bg-[#DCFCE7] px-1.5 py-0.5 rounded">
                      {stg.stage}
                    </span>
                    <span className="text-[11px] font-bold text-slate-400">
                      0{i + 1}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {stg.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-normal">
                    {stg.detail}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: PREPARATION INSIGHTS ────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white border border-slate-200 rounded-2xl p-6 sm:p-10">
          <div className="lg:col-span-6 space-y-4">
            <Badge variant="brand" size="sm">
              Capability & Rigor
            </Badge>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Honest Feedback. <br />
              Actionable Performance Analytics.
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              RecruitReady rejects fake statistics. When you complete an assessment, your scores are derived directly from database evaluations.
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-slate-700 pt-2">
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#166534] shrink-0" />
                <span>Granular topic breakdowns by speed and accuracy</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#166534] shrink-0" />
                <span>Full execution logs and test cases for coding solutions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon className="w-4 h-4 text-[#166534] shrink-0" />
                <span>Honest milestone badges reflecting real completed modules</span>
              </li>
            </ul>
          </div>

          <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800">
                Evaluation Engine Model
              </span>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-semibold">
                Validated
              </span>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              <div className="p-3 bg-white border border-slate-100 rounded-lg flex items-center justify-between">
                <span>Quantitative & Data Interpretation</span>
                <span className="font-mono font-semibold text-slate-900">Real-Time Scoring</span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg flex items-center justify-between">
                <span>Coding Test Suite Verification</span>
                <span className="font-mono font-semibold text-slate-900">Custom Testcases</span>
              </div>
              <div className="p-3 bg-white border border-slate-100 rounded-lg flex items-center justify-between">
                <span>Company Round Simulation</span>
                <span className="font-mono font-semibold text-slate-900">Authentic Timers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 7: WHY CHOOSE RECRUITREADY ─────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <Badge variant="neutral" size="sm" className="mb-3">
            Product Values
          </Badge>
          <h2 className="text-2xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Why Students Choose RecruitReady
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2">
            Built for engineering students focused on measurable placement outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BENEFIT_ITEMS.map((item) => (
            <div
              key={item.title}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7] flex items-center justify-center mb-3.5">
                <CheckIcon className="w-4 h-4" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">
                {item.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── SECTION 8: FINAL CTA ───────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-[#166534] rounded-2xl p-8 sm:p-14 text-center text-white relative overflow-hidden shadow-sm">
          <div className="max-w-2xl mx-auto space-y-4">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
              Your Placement Preparation Starts Here.
            </h2>
            <p className="text-sm sm:text-base text-[#DCFCE7] leading-relaxed max-w-xl mx-auto">
              Equip yourself with structured aptitude problem sets, coding challenges, and mock tests today.
            </p>
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to={primaryActionTo} className="no-underline w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  fullWidth
                  className="bg-white text-[#166534] hover:bg-slate-50 border-white font-semibold"
                  iconRight={<ArrowRightIcon className="w-4 h-4" />}
                >
                  {primaryActionLabel}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

export default HomePage;
