# RecruitReady frontend upgrade report (final: Swiss design + less scrolling)

Scope: frontend only (the backend was not supplied). Each claim states how it was verified.

## 1. Critical fixes found along the way
- **Production build crashed on load** in the original (white screen, `__exportAll is not a function`) because of the manual `http-vendor` chunk split in `vite.config.js`. Fixed (react-vendor split kept). Verified in a real browser.
- **Undefined colour tokens**: `bg-brand`, `text-brand`, `border-brand`, `ring-brand-light`, `text-brand-dark`, `hover:text-primary-hover` (~28 uses) pointed to colours that never existed, so the current question in the mock-test palette and the selected option had no background. Now defined as aliases of the primary colour. Verified visually.
- Code editor Tab key trapped keyboard focus; fixed (Esc then Tab leaves the editor).
- Search modal arrow-key order did not match the displayed order; fixed.

## 2. Design: Swiss monochrome (chosen direction)
Black brand colour, neutral ramp, status-only colour, Space Grotesk headings + Inter body, tight radii, borders instead of shadows, abstract animated hero (grid + soft drifting glows, typing line, module chips, no fake product mockup). Dark theme is a true Swiss dark (black surfaces, white primary). Full spec: `docs/DESIGN_SYSTEM.md`.
Removed as requested: accent colour picker, Warm Paper theme, text-size control. The appearance menu is Light / Dark / System.

## 3. Less scrolling (measured, 1440x900, mocked data)
| Page | Before (px) | After (px) |
|---|---|---|
| Student dashboard | 1189 | 949 (-20%) |
| Mock test history | 1052 | 900 (fits one screen) |
| Admin students | 1365 | 1161 (-15%) |
| Admin companies | 1126 | 970 (-14%) |
| Admin dashboard | 1570 | 1463 (-7%) |
Mock data is small; with real data the table changes matter more (bounded height + sticky header on desktop).
What changed: compact page headers and tighter page padding; denser sticky-header tables; dashboard right column in tabs (Focus / Targets / Goals); "Recently viewed" moved into the activity tabs; slim "Continue" banner; collapsible icon-rail sidebars (student + admin); collapsed-by-default answer review on result pages (printing still includes it); admin dashboard spacing and recent-registrations capped at 5.
Already present and kept: Progress page tabs (Overview / Aptitude / Coding / Mock), autosave indicator and mobile palette in test sessions.

## 4. Features carried over from earlier rounds
Command palette (Ctrl/Cmd+K), `?` shortcut help, recently viewed, syntax-highlighted editor, mock-test keyboard shortcuts, question slide transition, timer pulse, Continue-from-history, first-run tour, CSV export + Print on history pages, print stylesheet, PWA basics (manifest, brand icons, static-asset service worker, offline banner), reduced-motion support, animated counters/rings/confetti.

## 5. Testing performed
- `npm run build`: passes; production bundle loads.
- `npm run lint`: 0 errors, 119 warnings (original baseline 106; extra ones are structural warnings in new files and QA scripts).
- `npm run qa:smoke`: 41/41 checks pass in Chromium against the production build with a mocked API (theme menu/persistence, Swiss tokens in light and dark, removed options really gone, sidebar collapse/persist, dashboard tabs, palette, editor, recently viewed, CSV export, mock-session shortcuts, reduced motion, 390px overflow, no runtime JS errors).
- Screenshots in `qa/preview/` regenerate with `node qa/preview.mjs`.
- **Not tested**: real login/backend data, aptitude sessions, admin CRUD pages, PDF preview, Safari/Firefox, screen readers, real installed PWA. Pages not in the screenshots (companies/resources lists with data, profile, leaderboard, admin tables with data, progress charts) were restyled through tokens but not individually reviewed; expect small tweaks.

## 6. Known limits / next steps
- Admin create/edit forms are still single long forms (tabs/drawers not done). Admin lists use client-visible page sizes already in the code.
- ~19 inline hex colours remain in JSX for Google brand icons, status colours and a few charts.
- No TanStack Query migration; admin pages remain very large files.
- JWT still in `localStorage`. Code execution, daily challenge, announcements and real-time notifications need backend work (`docs/BACKEND_NEEDS.md`).

## 7. Run
```
npm install
npm run dev          # http://localhost:5173 (proxies /api to :5000)
npm run build && npm run preview
```
