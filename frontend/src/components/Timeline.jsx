/**
 * Timeline — How It Works section.
 * Horizontal on desktop, vertical on mobile.
 */

const STEPS = [
  {
    number: "01",
    title: "Create Your Profile",
    description: "Set up your preparation profile, select your target companies, and define your goals.",
  },
  {
    number: "02",
    title: "Practice & Learn",
    description: "Work through aptitude questions, coding problems, and structured study materials at your own pace.",
  },
  {
    number: "03",
    title: "Take Mock Tests",
    description: "Test yourself under realistic placement conditions with full-length timed assessments.",
  },
  {
    number: "04",
    title: "Track & Improve",
    description: "Review your performance, identify weak areas, and focus your preparation where it matters most.",
  },
];

function Timeline() {
  return (
    <div className="relative">
      {/* Desktop: horizontal connector line — centered through the 56px circles (top-7 = 28px = half of h-14) */}
      <div
        className="hidden md:block absolute top-7 left-7 right-7 h-px bg-[#D9E2EC] z-0"
        aria-hidden="true"
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-0 md:gap-6 relative z-10">
        {STEPS.map((step, index) => (
          <TimelineStep key={step.number} step={step} isLast={index === STEPS.length - 1} />
        ))}
      </div>
    </div>
  );
}

function TimelineStep({ step, isLast }) {
  return (
    <div className="flex md:flex-col items-start gap-4 md:gap-0">
      {/* Number badge + vertical line (mobile) */}
      <div className="flex-shrink-0 flex flex-col items-center">
        <div className="w-14 h-14 rounded-full border-2 border-[#D9E2EC] bg-white flex items-center justify-center md:mb-5 shadow-sm">
          <span className="text-sm font-bold text-[#2563EB]">{step.number}</span>
        </div>
        {/* Mobile vertical connector */}
        {!isLast && (
          <div className="md:hidden w-px flex-1 min-h-[2rem] bg-[#D9E2EC] my-1" aria-hidden="true" />
        )}
      </div>

      {/* Content */}
      <div className="pb-8 md:pb-0 pt-1 md:pt-0">
        <h3 className="text-[#172B4D] font-semibold text-base mb-2">{step.title}</h3>
        <p className="text-[#52606D] text-sm leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}

export default Timeline;
