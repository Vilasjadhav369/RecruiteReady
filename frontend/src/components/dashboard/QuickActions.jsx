import QuickActionCard from "./QuickActionCard.jsx";
import {
  AptitudeIcon,
  CodingIcon,
  MockTestIcon,
  CompanyIcon,
  ResourcesIcon,
  ProgressIcon,
} from "./DashboardIcons.jsx";

const ACTIONS = [
  {
    title: "Practice Aptitude",
    description: "Quantitative, Logical, and Verbal reasoning questions with step-by-step solutions.",
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
    description: "Full-length timed assessments modeled after leading placement hiring patterns.",
    icon: MockTestIcon,
    to: "/mock-tests",
  },
  {
    title: "Explore Companies",
    description: "Company-specific recruitment patterns, past questions, and hiring criteria.",
    icon: CompanyIcon,
    to: "/companies",
  },
  {
    title: "Browse Study Materials",
    description: "Curated roadmaps, interview guides, cheat sheets, and core CS fundamentals.",
    icon: ResourcesIcon,
    to: "/resources",
  },
  {
    title: "View Progress",
    description: "Detailed analytics of your accuracy, completion rates, and focus areas.",
    icon: ProgressIcon,
    to: "/progress",
  },
];

/**
 * QuickActions — Grid of 6 placement preparation shortcuts.
 */
function QuickActions() {
  return (
    <div>
      <div className="mb-4">
        <h2 className="text-lg font-bold text-[#172B4D]">Quick Actions</h2>
        <p className="text-xs text-[#52606D] mt-0.5">Jump directly into high-impact preparation activities</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
        {ACTIONS.map((action) => (
          <QuickActionCard key={action.to} {...action} />
        ))}
      </div>
    </div>
  );
}

export default QuickActions;
