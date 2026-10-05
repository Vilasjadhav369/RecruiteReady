import React from "react";
import { Link, useLocation } from "react-router-dom";

const MODULE_MAP = {
  "/admin/coding": {
    title: "Coding Problems Management",
    description: "Manage LeetCode/HackerRank style technical problems, test cases, and language templates.",
    badge: "Phase 8+",
  },
  "/admin/companies": {
    title: "Company Tracks & Patterns",
    description: "Manage enterprise hiring tracks (TCS, Infosys, Amazon, etc.), syllabus breakdown, and round criteria.",
    badge: "Future Phase",
  },
  "/admin/resources": {
    title: "Learning Resources & Roadmaps",
    description: "Upload study material, interview cheat sheets, curated video playlists, and core CS notes.",
    badge: "Future Phase",
  },
  "/admin/mock-tests": {
    title: "Mock Assessments Engine",
    description: "Create timed assessment papers, define grading rubrics, cutoffs, and proctoring settings.",
    badge: "Future Phase",
  },
  "/admin/reviews": {
    title: "Interview Experiences & Moderation",
    description: "Review and moderate student-submitted interview experiences and placement feedback.",
    badge: "Future Phase",
  },
  "/admin/analytics": {
    title: "Platform Analytics & Insights",
    description: "Deep dive into student cohort performance, test completion rates, and preparation benchmarks.",
    badge: "Future Phase",
  },
  "/admin/settings": {
    title: "Administrator Settings",
    description: "Configure system security policies, registration controls, and integration endpoints.",
    badge: "Admin Core",
  },
};

export default function AdminPlaceholderPage() {
  const location = useLocation();
  const moduleInfo = MODULE_MAP[location.pathname] || {
    title: "Module Under Development",
    description: "This administrative module is scheduled for implementation in an upcoming phase.",
    badge: "Scheduled",
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#DCFCE7] text-[#14532D] border border-[#BBF7D0]">
            {moduleInfo.badge}
          </span>
          <span className="text-xs text-slate-600 font-medium">Coming Soon</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          {moduleInfo.title}
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-xl">
          {moduleInfo.description}
        </p>
      </div>

      <div className="bg-white border border-slate-200/80 rounded-2xl p-12 text-center shadow-xs">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-600 mb-4 shadow-2xs">
          <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h3 className="text-base font-bold text-slate-900">Module Scheduled</h3>
        <p className="mt-1 text-sm text-slate-600 max-w-md mx-auto">
          This administrative management console will be activated once the corresponding student subsystem is initialized. No simulated records or mock placeholders are present.
        </p>
        <div className="mt-6">
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#166534] hover:bg-[#14532D] text-white text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Admin Overview
          </Link>
        </div>
      </div>
    </div>
  );
}
