import React from "react";
import PreparationMetricCard from "./PreparationMetricCard.jsx";
import { AptitudeIcon, CodingIcon, MockTestIcon } from "../ui/Icons.jsx";
import { SectionHeader } from "../ui/SectionHeader.jsx";

/**
 * PreparationOverview — Primary 3-card metric section for core placement domains.
 * Uses strictly genuine aggregate figures from backend.
 */
function PreparationOverview({ preparation }) {
  const apt = preparation?.aptitude || { attempted: 0, completed: 0 };
  const code = preparation?.coding || { attempted: 0, solved: 0 };
  const mock = preparation?.mockTests || { attempted: 0, completed: 0 };

  return (
    <div className="space-y-3.5">
      <SectionHeader
        title="Preparation Overview"
        subtitle="Aggregated metrics from your genuine practice attempts and assessments."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PreparationMetricCard
          title="Aptitude"
          icon={AptitudeIcon}
          attempted={apt.attempted}
          completed={apt.completed}
          unit="sessions"
          to="/aptitude"
          emptyMessage="No practice sessions completed yet. Begin with quantitative or logical topics."
        />
        <PreparationMetricCard
          title="Coding"
          icon={CodingIcon}
          attempted={code.attempted}
          completed={code.solved}
          unit="problems"
          to="/coding"
          emptyMessage="No coding problems solved yet. Start with core data structures."
        />
        <PreparationMetricCard
          title="Mock Tests"
          icon={MockTestIcon}
          attempted={mock.attempted}
          completed={mock.completed}
          unit="tests"
          to="/mock-tests"
          emptyMessage="No mock assessments completed yet. Test under timed conditions."
        />
      </div>
    </div>
  );
}

export default PreparationOverview;
