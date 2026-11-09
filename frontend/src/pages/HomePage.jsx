import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import companyService from "../services/companyService.js";
import { Button } from "../components/ui/Button.jsx";
import { Card } from "../components/ui/Card.jsx";
import { Badge } from "../components/ui/Badge.jsx";
import { Skeleton } from "../components/ui/Skeleton.jsx";
import HeroAbstract from "../components/home/HeroAbstract.jsx";
import { Reveal } from "../components/ui/Reveal.jsx";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompanyIcon,
  ArrowRightIcon,
  CheckIcon,
  ChevronRightIcon,
} from "../components/ui/Icons.jsx";

const CORE_MODULES = [
  {
    icon: AptitudeIcon,
    title: "Aptitude Practice",
    badge: "Quantitative & Logic",
    description:
      "Quantitative math, logical reasoning, and verbal problem banks with detailed step-by-step solutions.",
    highlights: ["Topic-wise filtering", "Formula breakdowns", "Speed & accuracy analysis"],
    to: "/aptitude",
    actionLabel: "Start Aptitude Practice",
  },
  {
    icon: CodingIcon,
    title: "Algorithmic Coding",
    badge: "DSA & Problem Solving",
    description:
      "Curated coding challenges across arrays, strings, trees, and dynamic programming with real-time test execution.",
    highlights: ["In-browser code editor", "Custom testcase runner", "Execution verdict history"],
    to: "/coding",
    actionLabel: "Start Coding Practice",
  },
  {
    icon: MockTestIcon,
    title: "Timed Mock Assessments",
    badge: "Exam Simulation",
    description:
      "Full-length placement simulations mirroring actual company hiring rounds with realistic timers and sectional cutoffs.",
    highlights: ["Countdown timers", "Sectional navigation", "Instant scorecard & diagnostic review"],
    to: "/mock-tests",
    actionLabel: "Attempt Mock Test",
  },
  {
    icon: CompanyIcon,
    title: "Company Dossiers",
    badge: "Recruitment Tracks",
    description:
      "Recruiter-specific question archives, hiring round patterns, and eligibility breakdowns for visiting recruiters.",
    highlights: ["Hiring round patterns", "Past question archives", "Package & role details"],
    to: "/companies",
    actionLabel: "Explore Company Tracks",
  },
];

const ROADMAP_STEPS = [
  {
    num: "1",
    phase: "Foundation",
    title: "Aptitude & Analytical Core",
    description:
      "Build foundational numerical speed, quantitative aptitude, and logical reasoning to clear initial screening tests.",
    topics: ["Arithmetic & Algebra", "Logical Deductions", "Data Interpretation", "Verbal Ability"],
  },
  {
    num: "2",
    phase: "Technical Skills",
    title: "Data Structures & Algorithms",
    description:
      "Master hands-on programming problems in Arrays, Strings, Searching, Sorting, and Dynamic Programming.",
    topics: ["Arrays & Two Pointers", "Hashing & Strings", "Trees & Graphs", "Dynamic Programming"],
  },
  {
    num: "3",
    phase: "Assessment",
    title: "Full-Length Timed Mocks",
    description:
      "Acclimate to real exam pressure through timed full-length assessments that test endurance and accuracy under pressure.",
    topics: ["Sectional Timing", "Negative Marking Drills", "Real-Time Scorecard", "Diagnostic Review"],
  },
  {
    num: "4",
    phase: "Placement Ready",
    title: "Company-Specific Interview Prep",
    description:
      "Deep dive into visiting recruiter patterns (TCS, Infosys, Amazon, etc.) and master technical questions asked in campus rounds.",
    topics: ["Company Round Patterns", "Past Interview Questions", "Core CS Revision", "Placement Verification"],
  },
];

const PLATFORM_PILLARS = [
  {
    title: "100% Real Evaluation",
    description:
      "Every question solved, code submitted, and test completed writes to your authentic database profile. Zero simulated or fake metrics.",
  },
  {
    title: "Realistic Test Environment",
    description:
      "Experience accurate timer constraints, sectional cutoffs, and question navigators matching real online recruitment exams.",
  },
  {
    title: "Curated by Placement Cells",
    description:
      "Practice questions and company dossiers are continuously updated by administrators to match the current 2026–2027 hiring season.",
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
        const data = await companyService.getCompanies({ limit: 4 });
        if (isMounted) {
          const list = Array.isArray(data) ? data : data?.companies || [];
          setCompanies(list.slice(0, 4));
        }
      } catch  {
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
  const primaryActionLabel = isAuthenticated ? "Go to Dashboard" : "Start Preparing Free";

  return (
    <div className="space-y-14 sm:space-y-16 pb-16">

      {/* ── 1. HERO SECTION ─────────────────────────────────── */}
      <HeroAbstract primaryTo={primaryActionTo} primaryLabel={primaryActionLabel} />

      {/* ── 2. CORE PREPARATION MODULES ─────────────────────── */}
      <Reveal as="section" id="features" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <Badge variant="brand" size="sm" className="mb-2.5">
            Core Modules
          </Badge>
          <h2 className="text-balance text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Everything You Need to Get Selected
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Targeted preparation tracks engineered specifically for campus recruitment workflows.
          </p>
        </div>

        {/* 2-Column Spacious Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {CORE_MODULES.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.title}
                hoverable
                className="p-6 sm:p-7 flex flex-col justify-between group border-slate-200"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary-soft text-primary border border-primary-tint flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-150">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-primary bg-primary-tint px-2.5 py-0.5 rounded-full border border-primary-border">
                      {module.badge}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary transition-colors mb-2">
                    {module.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                    {module.description}
                  </p>

                  {/* Bullet Highlights */}
                  <div className="space-y-1.5 mb-5 pt-3 border-t border-slate-100">
                    {module.highlights.map((item) => (
                      <div key={item} className="flex items-center gap-2 text-xs text-slate-600">
                        <CheckIcon className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="pt-3 border-t border-slate-100">
                  <Link
                    to={module.to}
                    className="inline-flex items-center justify-between w-full text-xs sm:text-sm font-semibold text-primary group-hover:text-primary-dark no-underline"
                  >
                    <span>{module.actionLabel}</span>
                    <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      </Reveal>

      {/* ── 3. PLACEMENT ROADMAP (Clean Vertical Sequence) ──── */}
      <Reveal as="section" className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <Badge variant="brand" size="sm" className="mb-2.5">
            Structured Workflow
          </Badge>
          <h2 className="text-balance text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            The 4-Step Placement Roadmap
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            A clear four-stage sequence to build your skills from basics to final campus offers.
          </p>
        </div>

        {/* Linear Step-by-Step Flow ("Below and Below") */}
        <div className="space-y-4">
          {ROADMAP_STEPS.map((step) => (
            <div
              key={step.num}
              className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 hover:border-slate-300 transition-all shadow-xs flex items-start sm:items-center gap-4 sm:gap-6"
            >
              {/* Step Number Circle */}
              <div className="shrink-0 w-10 h-10 rounded-full bg-primary text-white font-bold text-sm flex items-center justify-center">
                {step.num}
              </div>

              {/* Step Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-tint px-2 py-0.5 rounded">
                    {step.phase}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {step.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-2">
                  {step.description}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {step.topics.map((t) => (
                    <span
                      key={t}
                      className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── 4. COMPANY PREPARATION (Visiting Recruiters) ────── */}
      <Reveal as="section" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8 pb-3 border-b border-slate-200 gap-3">
          <div>
            <Badge variant="neutral" size="sm" className="mb-2">
              Recruiter Dossiers
            </Badge>
            <h2 className="text-balance text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Target Top Visiting Recruiters
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Real company hiring patterns and syllabus tracks from the database.
            </p>
          </div>
          <Button to="/companies" variant="outline" size="sm" iconRight={<ArrowRightIcon className="w-3.5 h-3.5" />} className="shrink-0">
              View All Companies
            </Button>
        </div>

        {companiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-5 bg-white border border-slate-200 rounded-xl space-y-3">
                <Skeleton className="h-5 w-1/2" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            ))}
          </div>
        ) : companies.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {companies.map((company) => (
              <Card
                key={company._id || company.id || company.name}
                hoverable
                className="p-5 flex flex-col justify-between group border-slate-200"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                      <CompanyIcon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors truncate">
                        {company.name}
                      </h4>
                      {company.industry && (
                        <span className="text-[11px] text-slate-500 block truncate">
                          {company.industry}
                        </span>
                      )}
                    </div>
                  </div>

                  {company.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
                      {company.description}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px] truncate max-w-[100px]">
                    {company.packageRange || "Campus Track"}
                  </span>
                  <Link
                    to={`/companies/${company._id || company.id}`}
                    className="font-semibold text-primary inline-flex items-center gap-0.5 no-underline group-hover:underline shrink-0"
                  >
                    <span>View Rounds</span>
                    <ChevronRightIcon className="w-3 h-3" />
                  </Link>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 px-4 bg-white border border-slate-200 rounded-xl">
            <CompanyIcon className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800">
              No companies available yet.
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Administrator-curated company recruitment profiles will appear here as they are published.
            </p>
          </div>
        )}
      </Reveal>

      {/* ── 5. BUILT FOR REAL OUTCOMES ─────────────────────── */}
      <Reveal as="section" id="about" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-xl mx-auto mb-10">
          <Badge variant="neutral" size="sm" className="mb-2">
            Academic Rigor
          </Badge>
          <h2 className="text-balance text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Why Students Choose RecruitReady
          </h2>
          <p className="text-sm text-slate-600 mt-1.5">
            Engineered exclusively for measurable campus placement outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {PLATFORM_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 transition-colors shadow-xs"
            >
              <div className="w-8 h-8 rounded-lg bg-primary-soft text-primary border border-primary-tint flex items-center justify-center mb-3.5">
                <CheckIcon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                {pillar.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {pillar.description}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── 6. FINAL CALL TO ACTION ────────────────────────── */}
      <Reveal as="section" className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="bg-primary rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-sm">
          <div className="max-w-xl mx-auto space-y-3.5">
            <h2 className="text-balance text-2xl sm:text-3xl font-bold tracking-tight text-white leading-tight">
              Your Placement Preparation Starts Here.
            </h2>
            <p className="text-xs sm:text-sm text-primary-tint leading-relaxed max-w-md mx-auto">
              Equip yourself with structured aptitude problem sets, coding challenges, and mock tests today.
            </p>
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button to={primaryActionTo} variant="outline" size="lg" fullWidth iconRight={<ArrowRightIcon className="w-4 h-4" />} className="bg-white text-primary hover:bg-slate-50 border-white font-semibold w-full sm:w-auto">
                  {primaryActionLabel}
                </Button>
            </div>
          </div>
        </div>
      </Reveal>

    </div>
  );
}

export default HomePage;
