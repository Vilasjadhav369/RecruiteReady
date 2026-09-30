import PreparationMetricCard from "./PreparationMetricCard.jsx";
import { AptitudeIcon, CodingIcon, MockTestIcon } from "./DashboardIcons.jsx";

/**
 * PreparationOverview — 3-card metric grid for Aptitude, Coding, and Mock Tests.
 */
function PreparationOverview({ preparation }) {
  const apt = preparation?.aptitude || { attempted: 0, completed: 0 };
  const code = preparation?.coding || { attempted: 0, solved: 0 };
  const mock = preparation?.mockTests || { attempted: 0, completed: 0 };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold text-[#172B4D]">Your Preparation</h2>
          <p className="text-xs text-[#52606D] mt-0.5">Track and master core placement assessment modules</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:gap-6">
        <PreparationMetricCard
          title="Aptitude"
          icon={AptitudeIcon}
          attempted={apt.attempted}
          completed={apt.completed}
          unit="questions"
          to="/aptitude"
          emptyMessage="No questions practiced yet. Begin with quantitative or logical topics."
        />
        <PreparationMetricCard
          title="Coding"
          icon={CodingIcon}
          attempted={code.attempted}
          completed={code.solved}
          unit="problems"
          to="/coding"
          emptyMessage="No coding problems solved yet. Start with fundamental data structures."
        />
        <PreparationMetricCard
          title="Mock Tests"
          icon={MockTestIcon}
          attempted={mock.attempted}
          completed={mock.completed}
          unit="tests"
          to="/mock-tests"
          emptyMessage="No mock tests completed yet. Test yourself under timed conditions."
        />
      </div>
    </div>
  );
}

export default PreparationOverview;
