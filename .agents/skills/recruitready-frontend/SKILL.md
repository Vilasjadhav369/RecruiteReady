---
name: recruitready-frontend
description: Master frontend design, UI/UX, and engineering specification for RecruitReady. Use whenever creating, styling, refactoring, reviewing, or auditing any frontend components, layouts, or pages in RecruitReady.
---

# RecruitReady — Master Frontend Design & Engineering Skill

> **Product**: RecruitReady — Integrated Placement Preparation Portal  
> **Target Audience**: College students preparing for campus placements, technical assessments, and interviews  
> **Tech Stack**: React 19, Vite, Tailwind CSS v4, React Router v7, Axios  
> **Backend Pairing**: Node.js + Express, MongoDB + Mongoose, JWT Authentication  
> **Scope**: **Frontend Only**. Backend business logic, API contracts, controllers, models, and database records are strictly protected.

---

## 1. Project Identity & Visual Philosophy

RecruitReady combines the restraint and refinement of **Apple interfaces**, the density and precision of **Linear**, and the prestige of a **Tier-1 Modern University workstation**. It is an academic productivity platform, not an entertainment app or social feed.

### Core Visual Principles
- **Clarity Over Clutter**: Generous whitespace, razor-sharp information hierarchy, structured visual rhythm.
- **Academic Seriousness**: Calm, trustworthy, restrained. No neon, no gaming aesthetics, no crypto visual noise.
- **Truth in Presentation**: Real data exclusively. Zero phantom metrics, zero fake testimonials, zero fabricated numbers.
- **Tactile Precision**: Clean 1px borders, subtle elevation shadows, deliberate interaction states.

---

## 2. Color System & Semantic Tokens

### Conceptual Palette
The approved palette is anchored in crisp whites, organic pale mints, deep academic greens, and neutral slates:

| Token Name | Hex Code | Semantic Role |
| :--- | :--- | :--- |
| **White** | `#FFFFFF` | Primary surface, card background, input field background |
| **Very Light Mint** | `#F0FDF4` | Page body background, soft badge tints, subtle card highlight |
| **Pale Mint** | `#DCFCE7` | Active selection background, hover state on primary actions, subtle pill background |
| **Fresh Green** | `#22C55E` | Primary accent, primary CTA buttons, active toggles, verified checkmarks |
| **Dark Green** | `#166534` | Primary brand headlines, active sidebar items, high-emphasis icons |
| **Deep Green** | `#14532D` | High-contrast headers, active text states, badge outlines |
| **Primary Text** | `#0F172A` | Page titles, primary card headings, high-contrast numbers |
| **Secondary Text** | `#475569` | Body prose, table headers, descriptions, subtitles |
| **Muted Text** | `#64748B` | Labels, captions, breadcrumbs, placeholder hints (WCAG 4.5:1 safe) |
| **Border** | `#E2E8F0` | Structural dividers, card borders, input borders |
| **Soft Border** | `#F1F5F9` | Inner table row dividers, subtle list item separations |

### Semantic Token Enforcement
- **Never** write raw hex values (e.g. `#102A43`, `#2563EB`, `#D9E2EC`) inside component JSX.
- Reference centralized design tokens via Tailwind CSS classes or `@theme` CSS variables defined in `index.css`.
- Ensure light-theme contrast ratios meet or exceed **WCAG 2.1 AA (4.5:1 minimum)** for all text against backgrounds.

---

## 3. Design Rules & Heuristics

### Required Patterns
- Generous, intentional whitespace separating sections.
- Restrained border radius: `rounded-md` (6px) for controls, `rounded-lg` (8px) for inputs, `rounded-xl` (12px) for cards.
- Subtle elevation shadows: `shadow-xs` or `shadow-sm` on white surfaces against light backgrounds.
- Explicit visual status badges with text + optional dot indicator.
- Contextual loading states (skeletons) mirroring the exact shape of incoming data.
- Accessible focus rings: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600`.

### Anti-Patterns (Strictly Avoid)
- **NO** gaming or esports aesthetic (no angled cuts, no scanlines, no glowing neon borders).
- **NO** crypto or Web3 tropes (no high-saturation gradients, no metallic/holographic badges).
- **NO** heavy glassmorphism (`backdrop-blur-md` on opaque data tables or content surfaces).
- **NO** random stock photography or decorative illustrations that convey no real academic information.
- **NO** fake reviews, fake ratings, or fake student placements.
- **NO** giant oversized headings that push content below the viewport fold.
- **NO** all-caps body copy.
- **NO** arbitrary one-off color choices in individual files.

---

## 4. Typography Scale & Hierarchy

All typography uses **Inter** (or system sans-serif fallback). Establish visual weight through font weight rather than oversized dimensions:

| Element | Viewport Scale | Font Weight | Line Height | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **H1** | `clamp(1.75rem, 3vw, 2.25rem)` (28px–36px) | `700` (Bold) | `1.25` | Page titles, primary dashboard greetings |
| **H2** | `clamp(1.25rem, 2.2vw, 1.625rem)` (20px–26px) | `600` (Semibold) | `1.3` | Section headings, modal titles |
| **H3** | `1.0625rem–1.25rem` (17px–20px) | `600` (Semibold) | `1.35` | Card titles, drawer headers |
| **H4 / Subtitle** | `0.875rem–1rem` (14px–16px) | `600` (Semibold) | `1.4` | Table column headers, group titles |
| **Body** | `0.875rem–1rem` (14px–16px) | `400` / `500` | `1.6` | Explanations, problem descriptions, review texts |
| **Small / Caption** | `0.75rem–0.8125rem` (12px–13px) | `500` / `600` | `1.4` | Badges, timestamps, helper text |
| **Monospace** | `0.75rem–0.875rem` (12px–14px) | `500` | `1.5` | **Only** for code editor, test inputs, and numeric scores |

---

## 5. Spacing Scale & Vertical Rhythm

Use the strict 4px/8px geometric spacing scale:
`4px` (`gap-1`), `8px` (`gap-2`), `12px` (`gap-3`), `16px` (`gap-4`), `20px` (`gap-5`), `24px` (`gap-6`), `32px` (`gap-8`), `40px` (`gap-10`), `48px` (`gap-12`), `64px` (`gap-16`).

### Layout Cadence
- Page padding: `p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto`.
- Section vertical spacing: `space-y-6 sm:space-y-8`.
- Card internal padding: `p-4 sm:p-6`.
- Header-to-content distance: `mb-5` or `mb-6`.

---

## 6. Component Architecture & Reusability Contract

All core primitives must live in `frontend/src/components/ui/` with one authoritative implementation. **Never create redundant copies.**

### Component Authority Matrix
| Pattern | Authoritative Component | Prohibited Duplicates |
| :--- | :--- | :--- |
| **Button** | `components/ui/Button.jsx` | Raw `<button class="...">`, legacy inline CTA buttons |
| **Card Surface** | `components/ui/Card.jsx` | Custom `bg-white border rounded-xl` div wrappers |
| **Metric / Stat** | `components/ui/StatCard.jsx` | `AdminStatCard.jsx`, `MetricCard.jsx`, `PreparationMetricCard.jsx` |
| **Status Badge** | `components/ui/StatusBadge.jsx`, `Badge.jsx` | Ad-hoc colored pill spans |
| **Empty State** | `components/ui/EmptyState.jsx` | `components/EmptyState.jsx` |
| **Skeleton Loader**| `components/ui/Skeleton.jsx` | `components/LoadingSkeleton.jsx` |
| **Progress Bar** | `components/ui/ProgressBar.jsx` | `components/ProgressBar.jsx` |
| **Headers** | `components/ui/PageHeader.jsx`, `SectionHeader.jsx` | `components/SectionHeading.jsx` |
| **Icons** | `components/ui/Icons.jsx` | `components/dashboard/DashboardIcons.jsx`, inline SVG blocks |
| **Input / Search** | `components/ui/Input.jsx`, `SearchInput.jsx` | Unstyled raw `<input>` elements |
| **Modal / Dialog** | `components/ui/Modal.jsx` | Hand-rolled fixed overlay divs |

### Rules for New Components
1. Before creating a component, inspect `frontend/src/components/ui/`.
2. If a primitive lacks a specific feature, extend it via props or variants.
3. Only create a new component when the interaction pattern is fundamentally novel.

---

## 7. Primitives Specification

### StatCard Specification
A single unified `StatCard` handles all metrics across Student and Admin surfaces:
- **`standard`**: Label, value, icon, trend indicator, subtitle (Student Dashboard).
- **`compact`**: Minimalist square footprint for grids and summary headers.
- **`domain`**: Domain-specific progress tracking with unit indicators ("12 / 20 completed").
- **Safety**: Must parse numeric objects safely (`value?.total ?? value`) to guarantee `NaN` never renders.

### Unified Icon System (`components/ui/Icons.jsx`)
- All icons are crisp stroke SVG components with standard props (`w-4 h-4` or `w-5 h-5`).
- Stroke width: `1.75px`, stroke linecap/join: `round`, `aria-hidden="true"` by default.
- **Icon-only buttons MUST have an explicit `aria-label` or `<span className="sr-only">`.**

### Button Hierarchy
- **`primary`**: Fresh/Dark Green solid fill with high-contrast text (`bg-green-700 hover:bg-green-800 text-white`).
- **`secondary`**: Dark slate fill (`bg-slate-900 hover:bg-slate-800 text-white`).
- **`outline`**: White background with clean 1px border (`border-slate-200 hover:border-slate-300 text-slate-800`).
- **`ghost`**: Transparent background with subtle hover background (`hover:bg-slate-100 text-slate-700`).
- **`danger`**: Deep crimson for destructive actions (`bg-red-600 hover:bg-red-700 text-white`).
- **Touch target**: Minimum **44px × 44px** hit area on mobile viewports.

---

## 8. Forms & Inputs

- Every field must have a visible `<label>` bound via `htmlFor`.
- Error messages must appear directly below the affected field with `aria-live="polite"`.
- Password fields must provide an accessible show/hide password visibility toggle (`EyeIcon` / `EyeOffIcon`).
- Read-only fields (e.g., student ID, email during profile edit) must be visibly distinct and disabled.

---

## 9. Responsive Layouts & Breakpoint Contract

Every view must be tested and verified against the standard responsive matrix:

```
320px  ── Small mobile (SE, small Android)
375px  ── Standard mobile (iPhone)
640px  ── Large mobile / phablet (`sm`)
768px  ── Tablet portrait (`md`)
1024px ── Tablet landscape / small laptop (`lg`)
1280px ── Desktop (`xl`)
1440px ── Wide workstation (`2xl`)
```

### Critical Responsive Rules
- **No Horizontal Scroll**: Never allow `overflow-x: auto` on the `body` or root container.
- **Tables**: Wrap wide data tables in `<div className="w-full overflow-x-auto">` with sticky headers.
- **Coding Workspace**: On screens `< 1024px`, collapse dual-pane coding view into tabbed sections (`Problem Description` ↔ `Editor & Output`).
- **Assessment Controls**: Bottom action buttons must stack or wrap cleanly above mobile virtual keyboards.

---

## 10. Accessibility (WCAG 2.1 AA)

- **Landmarks**: Proper semantic HTML (`<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>`).
- **Focus Rings**: Never remove focus rings. Enforce visible 2px outlines with 2px offset.
- **Modal Focus Trap**: Modals must trap focus while open and restore focus to trigger element on close.
- **Timers**: Timed assessment clocks must have `role="timer"` and announce countdown milestones (5m, 1m, 30s) via `aria-live="polite"`.
- **Contrast**: Text contrast must exceed `4.5:1` for regular text and `3:1` for large text against any background.

---

## 11. Real Data & State Integrity Policy

### The Real Data Rule
**Never invent, fabricate, or hardcode production data.**
- No fake student names, fake companies, fake placement percentages, fake ratings, or fake reviews.
- All numbers and cards must be derived directly from backend API responses.
- If an API returns zero items or empty arrays, render a polished, informative `EmptyState`.

### Feedback State Trilogy
Every data-driven page or section must handle all three states gracefully:
1. **Loading**: Renders geometric skeleton cards matching the destination layout.
2. **Error**: Displays an accessible `ErrorState` with retry button.
3. **Empty**: Renders `EmptyState` explaining why no data is present and offering a helpful CTA.

---

## 12. Frontend Performance & Code Splitting

- **Route-Level Code Splitting**: All major route components in `AppRoutes.jsx` must be lazy-loaded using `React.lazy()` and wrapped in `<Suspense fallback={<RouteLoadingSkeleton />}>`.
- **Heavy Modules**: The Coding Editor (Monaco/CodeMirror), Analytics Charts, and Full Mock Test Simulator must load in isolated asynchronous chunks.
- **Measurement**: Any performance improvement must be verified through production build metrics (`npm run build`).

---

## 13. Frontend Implementation Workflow

Every frontend task must proceed through the standardized 10-step protocol:

1. **Inspect Existing Code**: Review the current component, layout, and service implementation.
2. **Identify Reusable Primitives**: Check `components/ui/` before authoring any new markup.
3. **Verify API Contract**: Review the corresponding API response shape in `services/`.
4. **Plan Minimal Edit**: Determine the smallest changes that achieve the goal.
5. **Implement Changes**: Adhere strictly to the green/mint palette and token architecture.
6. **Verify Build**: Run `npm run build` to confirm zero TypeScript/Vite bundle errors.
7. **Browser QA**: Validate page rendering, link targets, and interactions.
8. **Responsive Audit**: Test viewports at 375px, 768px, and 1280px.
9. **Accessibility Check**: Ensure keyboard navigation, focus visibility, and contrast.
10. **Document Changes**: Report exact files modified and architectural rationale.

---

## 14. Full-Stack Safety Guardrails

- **Zero Backend Edits**: Do not touch `backend/src/**` (controllers, models, routes, middleware, services).
- **Zero Schema Changes**: Do not modify MongoDB schemas or invent frontend fields not backed by the database.
- **Zero Destructive Git**: Never run `git reset --hard`, `git clean -fd`, or force-push commands.
- **Foundational Order**: Always work in sequence:  
  `1. Tokens & Theme` → `2. UI Primitives` → `3. Layouts & Navigation` → `4. Feature Pages`.
