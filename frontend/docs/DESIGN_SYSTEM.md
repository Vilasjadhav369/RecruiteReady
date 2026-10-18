# RecruitReady — Swiss design system (handoff notes)

This file is the single reference for anyone (or any tool, e.g. Antigravity) continuing work on the UI.

## Principles
1. **Monochrome.** Black is the brand colour. Colour is reserved for status only: green = success, amber = warning, red = danger.
2. **Borders, not shadows.** Cards and controls are separated by 1px neutral borders. Shadows exist only on overlays (menus, dialogs).
3. **Tight geometry.** Corner radius 2–12px (`--radius-*`), never pill-shaped cards.
4. **Type.** Headings: Space Grotesk, weight 600, letter-spacing -0.03em. Body: Inter.
5. **Show less, reveal on demand.** Summaries first; details in tabs, accordions, drawers and collapsed sections.

## Tokens (single source of truth: `src/index.css` `@theme`)
- Brand: `--color-primary` #0A0A0A (white in dark). `bg-primary` + `text-white` is the primary button; dark mode inverts it automatically.
- Neutral ramp replaces Tailwind slate: 50 #F7F7F7 … 900 #0A0A0A. Blue/indigo/sky/violet/purple/cyan utilities are remapped to the same ramp, so legacy "info" chips render neutral.
- Surfaces: page `--color-background` #FAFAFA, card `--color-surface` #FFFFFF, border `--color-border` #E3E3E3.
- Dark theme: `src/styles/theme-dark.css` is **generated** — edit `scripts/gen-dark-theme.mjs`, then `npm run gen:dark-theme`.
- Themes: Light, Dark, System (`src/context/ThemeContext.jsx`, key `rr_theme`, applied before first paint in `index.html`).

## Components and behaviours worth knowing
- `components/ui/*` is the shared kit. `PageHeader` is compact (one-line description). `Table` has a sticky header and bounded height on desktop.
- Sidebars (student + admin) collapse to an icon rail; state in `localStorage` (`rr_sidebar_student|admin`). Labels carry `rr-nav-label` / `rr-nav-hide`.
- Dashboard: right column is tabbed (Focus areas / Targets / Goals); the activity card has a third tab "Recently viewed"; "Continue" is a one-line banner.
- Result pages: the long answer review is collapsed behind a toggle and always shown when printing.
- Motion lives in `src/styles/motion.css` (transform/opacity only; everything disabled under `prefers-reduced-motion`).

## Do / don't
- Do use semantic tokens and existing utilities (`bg-white`, `text-slate-900`, `border-slate-200`); they re-theme automatically.
- Don't add new brand hues, gradients on working screens, drop shadows on cards, or hex colours in JSX (use `var(--color-*)`).
- Don't fake data. Empty states must say what to do to generate the data.

## Verifying changes
```
npm run build
npm run lint          # 0 errors expected
npm run qa:smoke      # Playwright, mocked API (needs: npx playwright install chromium)
node qa/measure.mjs after   # page-height regression check
```
