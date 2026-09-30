import React from "react";
import QuickActionCard from "./QuickActionCard.jsx";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompanyIcon,
} from "../ui/Icons.jsx";
import { SectionHeader } from "../ui/SectionHeader.jsx";

const PRIMARY_ACTIONS = [
  {
    title: "Practice Aptitude",
    description: "Quantitative, Logical, and Verbal reasoning question banks with detailed step-by-step solutions.",
    icon: AptitudeIcon,
    to: "/aptitude",
  },
  {
    title: "Solve Coding Problems",
    description: "Algorithmic challenges across arrays, strings, dynamic programming, and data structures.",
    icon: CodingIcon,
    to: "/coding",
  },
  {
    title: "Take a Mock Test",
    description: "Full-length timed assessments modeled after leading campus recruitment hiring patterns.",
    icon: MockTestIcon,
    to: "/mock-tests",
  },
  {
    title: "Explore Companies",
    description: "Company-specific recruitment patterns, past questions, eligibility, and hiring criteria.",
    icon: CompanyIcon,
    to: "/companies",
  },
];

/**
 * QuickActions — 'Continue Preparing' section featuring 4 core preparation modules.
 */
function QuickActions() {
  return (
    <div className="space-y-3.5">
      <SectionHeader
        title="Continue Preparing"
        subtitle="Jump directly into high-impact practice modules"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PRIMARY_ACTIONS.map((action) => (
          <QuickActionCard key={action.to} {...action} />
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
