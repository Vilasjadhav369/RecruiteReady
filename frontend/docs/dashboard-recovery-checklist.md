# Dashboard Verification & Regression Checklist

This checklist verifies that the student dashboard (`/dashboard`) renders without errors under various feature flag configurations, authentication states, and dataset shapes.

## Test Environment Setup
1. Set `VITE_ENABLE_CODING=false` in your environment (or pass via CLI when launching Vite).
2. Start the development server:
   ```bash
   npm --prefix frontend run dev
   ```
3. Open browser DevTools (`F12`), switch to the **Console** tab, and preserve logs.

---

## Scenario 1: New Student (Zero-Data / Fresh Onboarding)
- [ ] **Auth State**: Log in as a newly registered student (`onboardingCompleted: true`, no previous mock tests or aptitude sessions).
- [ ] **Navigation**: Navigate to `http://localhost:5173/dashboard`.
- [ ] **Header Verification**:
  - [ ] Dashboard header renders with student avatar and name.
  - [ ] Press `Ctrl+K` (or `Cmd+K`): `GlobalSearchModal` opens cleanly without throwing `ReferenceError: isCodingEnabled is not defined`.
  - [ ] Verify search palette commands exclude "Coding Practice" when `VITE_ENABLE_CODING=false`.
- [ ] **Zone 1 (Hero Command Bar & Profile Notice)**:
  - [ ] Command bar renders greeting and default 0 streak days.
  - [ ] Missing field banner lists missing profile items (e.g. target companies) with setup links.
- [ ] **Zone 2 (Launchpad Strip)**:
  - [ ] 3-up module strip displayed: Aptitude, Mock Tests, Companies (Coding card hidden when flag is off).
  - [ ] Zero counts displayed properly (e.g. `0 completed`, `Explore tracks`).
- [ ] **Zone 3 (Activity Feed & Readiness Sidebar)**:
  - [ ] Left column: `ActivityFeedTabs` renders empty state ("No activity yet").
  - [ ] Right column: `PlacementReadinessSidebar` renders pending index state ("Solve questions and complete mock assessments to generate your verified placement readiness index.").
  - [ ] No `ReferenceError` thrown by `PlacementReadinessCard` or `PlacementReadinessSidebar`.
- [ ] **Console Inspection**: 0 uncaught errors; no `ReferenceError: isCodingEnabled is not defined`; no boolean `inert` attribute warnings.

---

## Scenario 2: Active Student (Populated Data)
- [ ] **Auth State**: Log in as an existing active student with mock test attempts, aptitude accuracy, and target companies.
- [ ] **Navigation**: Navigate to `/dashboard`.
- [ ] **Data Rendering**:
  - [ ] `PreparationLaunchpad` displays live counts for Aptitude and Mock Tests.
  - [ ] `ActivityFeedTabs` displays recent activity items (any coding entries filtered out safely if flag disabled).
  - [ ] `PlacementReadinessSidebar` shows calculated readiness score and breakdowns.
- [ ] **Console Inspection**: 0 uncaught exceptions or error boundaries triggered.

---

## Scenario 3: Automated QA Command
Run the headless Playwright regression script:
```bash
npm --prefix frontend run qa:dashboard
```
Both scenarios must print `PASS` and exit with code 0.
