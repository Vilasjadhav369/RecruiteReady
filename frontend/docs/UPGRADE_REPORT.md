# RecruitReady frontend upgrade report

Scope: this upgrade covers the frontend only (the backend was not part of the supplied zip).
Every claim below is marked with how it was verified.

## A. Original state (what was found)
- **Production build crashed on load.** `vite.config.js` split `react-vendor` and `http-vendor` chunks; the built app white-screened with `TypeError: __exportAll is not a function` (reproduced on the untouched original). Dev mode hid it. **Fixed** (see below). This is the most important fix in the upgrade.
- No dark mode; ~3,000 hardcoded Tailwind `slate-*`/`bg-white` utilities plus hardcoded hex in the base CSS.
- Placeholder Vite favicon, no PWA manifest/service worker/offline notice.
- Coding editor was a plain `<textarea>`; its Tab handler trapped keyboard focus (Esc did not release it despite the hint text).
- Animation limited to a page fade and toast fade.
- Search modal arrow-key order did not match the displayed order (companies/resources/coding).

## Pre-existing bug found and fixed during visual review
`bg-brand`, `text-brand`, `border-brand`, `ring-brand-light`, `text-brand-dark` and `hover:text-primary-hover` (about 28 usages, mostly mock-test pages, company card and history pages) referenced colour tokens that were never defined after the blue rebrand, so they rendered with no style. Visible effects: the current question cell and the selected option in the mock test had no background (white text on white), some progress bars were invisible. The tokens are now defined as aliases of the primary colour (`src/index.css`), so they follow theme and accent.

## Round 3 additions (Warm Paper + UX + motion)
- **Warm Paper theme** (cream surfaces, warm ink text, ink-blue accent, serif headings via Source Serif 4) as a third theme next to Light/Dark/System. Appearance menu in all headers also has an **accent colour picker** (Blue/Violet/Emerald/Orange) and **text size** (A-/A/A+). All persisted, applied before first paint.
- **Circular theme-reveal** transition (View Transitions API; falls back to a colour cross-fade; off for reduced motion).
- **Mock-test keyboard shortcuts** (A-D/1-4, arrows, M), **direction-aware question slide**, **timer pulse in the final minute** (mock + aptitude).
- **Continue where you left off** card (from real `in_progress` attempts; hidden when none or when the backend already supplies a continue activity), **first-run welcome tour** (once per user per device), **`?` shortcut help dialog** (accordion), **Practice this topic** link on weak topics in aptitude results (uses the existing `?topic=` param).
- **CSV export** (rows loaded on the page; formula-injection safe) and **Print / PDF** on aptitude, mock and coding history; Print on result pages; print stylesheet.
- **Progress ring** on Profile Readiness, **streak flame**, **animated score counters** on results, **skeleton shimmer**, **page-loader bar** while a lazy route loads, **bookmark pop** after a user toggle, **company logo zoom**, **line-chart draw-in** on Progress, **hero headline word reveal**, **animated gradient border** on the landing dashboard preview, **accordion** component.
- Found: autosave status indicator and mobile palette toggle already existed in both sessions (kept as is).

### Round 3: not done (honest list)
Sliding sidebar indicator (existing active-border style kept), answer-feedback pulse and badge-unlock animation (CSS exists, no matching feature to attach to), shared-element page transitions, a shared chart component (only the Progress line chart got the draw-in), PDF reading-position memory, a dedicated focus mode (test sessions are already full-screen), drag-and-drop avatar upload (backend endpoint unknown), per-page SEO, TanStack Query migration, splitting the giant admin pages.

## B. Design changes
- **Theme system**: light/dark/system, persisted under `rr_theme`, applied by an inline script before first paint (no flash), animated switch, `theme-color` meta updated. Dark palette is generated from the existing palette by `scripts/gen-dark-theme.mjs` into `src/styles/theme-dark.css` (re-run `npm run gen:dark-theme` after changing it), so all existing pages are themed without per-file edits. The royal-blue brand colour is unchanged.
- Theme toggle in public navbar, student header and admin header.
- Arbitrary hex classes (`text-[#172B4D]` etc.) replaced with tokens; base CSS now uses CSS variables.
- Brand favicon and PWA icons (replacing the Vite placeholder).

## C. Animations (all transform/opacity; all disabled under `prefers-reduced-motion`)
| Implemented | Where |
|---|---|
| Route slide/fade transition | Student + admin layouts (keyed by pathname) |
| Scroll reveal (one IntersectionObserver per element, auto-disconnect) | Landing page sections (`Reveal`) |
| Staggered entrance | Dashboard sections, preparation module cards |
| Typing text (screen-reader gets full text) | Landing hero |
| Animated soft gradient + floating decorative blobs | Landing hero only |
| Number counters | Dashboard module metrics (`AnimatedNumber`) |
| Card hover lift | Dashboard module cards (`.rr-lift`) |
| Ripple click feedback | All `ui/Button`s |
| Theme cross-fade, toggle icon rotation | Global / ThemeToggle |
| Confetti (once per result, only on the existing pass thresholds: mock >= 70%, aptitude >= 60%) | Result pages |
| Offline banner slide-in | Global |

Available but not yet applied broadly (CSS exists in `motion.css`): image zoom (`.rr-zoom`), animated gradient border (`.rr-border-glow`), accordion (`.rr-accordion`), pop micro-interaction (`.rr-pop`).
**Intentionally omitted**: custom cursor, magnetic buttons, 3D tilt, particles, parallax (judged to add cost without value for a study tool; none were added to test/coding screens).

## D. Feature matrix
| Feature | Status |
|---|---|
| Production build crash fix | Implemented and verified (browser) |
| Dark/light/system theme, persistence, no-flash | Implemented and verified (browser; landing, login, dashboard and coding pages reviewed visually, see I) |
| Command palette (Ctrl/Cmd+K): pages, theme toggle, admin link, recently viewed + existing backend search | Implemented and verified (browser) |
| Recently viewed (resources, companies, coding, mock tests; device-local, per user, cleared on logout) | Implemented and verified (browser, coding path) |
| Syntax-highlighted code editor (JS/Python/Java/C++), auto-indent, Tab/Shift+Tab, Esc releases focus trap, line numbers | Implemented and verified (browser) |
| PWA: manifest, icons, minimal service worker (static assets only, never `/api`), offline banner | Implemented; manifest/offline banner not installed-tested on a device; service worker only active in production builds |
| Reduced-motion support (CSS + JS) | Implemented and verified (browser emulation) |
| Mobile drawer no longer exposes hidden dialog to assistive tech (`inert`) | Implemented and verified |
| Responsive: no horizontal overflow at 390px on dashboard and coding page | Verified for those 2 pages only |
| Aptitude / mock-test timers, autosave, scoring | **Untouched** (existing behaviour preserved) |
| Code execution (run/submit) | Requires backend/external sandboxed runner; existing `execution_unavailable` handling preserved |
| TanStack Query migration for all pages | Deferred (only CompanyListPage uses it; large refactor, high regression risk without backend) |
| Splitting 1,300-1,900 line admin/progress pages | Deferred (same reason) |
| Mock-test keyboard shortcuts, save-status indicator, mobile question-palette sheet | Deferred |
| Per-page SEO meta (beyond titles + Open Graph defaults in `index.html`) | Partially implemented |
| Daily coding challenge, study plans, placement drives, announcements, interview experiences, real-time notifications | Requires backend (see BACKEND_NEEDS.md) |
| Export to PDF/CSV for student pages, print stylesheets, achievement badges, drag-and-drop avatar upload | Deferred |
| Unit tests | Not added. A Playwright smoke suite was added instead (`npm run qa:smoke`) |

## E. Files
Created: `src/styles/{theme-dark,motion,editor}.css`, `src/context/ThemeContext.jsx`, `src/components/ui/{ThemeToggle,Reveal,AnimatedNumber,TypingText}.jsx`, `src/components/common/OfflineBanner.jsx`, `src/components/coding/CodeEditor.jsx`, `src/components/dashboard/RecentlyViewed.jsx`, `src/hooks/{useReducedMotion,useInView,useOnlineStatus,useCelebrate}.js`, `src/lib/{confetti,highlight,ripple,recentlyViewed,registerSW}.js`, `public/{manifest.webmanifest,sw.js,favicon.svg,icons/*}`, `scripts/gen-dark-theme.mjs`, `qa/smoke.mjs`, `docs/*`.
Modified (key): `vite.config.js` (crash fix), `index.html`, `index.css`, `App.jsx`, `main.jsx`, `AuthContext.jsx`, both layouts, three headers, `GlobalSearchModal.jsx`, `DashboardPage.jsx`, `PreparationLaunchpad.jsx`, `HomePage.jsx`, `ui/Button.jsx`, `CodingProblemPage.jsx`, both result pages, four detail pages (recently viewed), both sidebars (`inert`), `package.json` (+ `playwright` devDependency, 2 scripts).
Removed: nothing.

## F. Backend dependencies
See `docs/BACKEND_NEEDS.md`.

## G. Testing actually performed
- `npm run build`: passes. Production bundle loads (it did not before).
- `npm run lint`: 0 errors, 121 warnings (baseline 106; extra ones are structural warnings in new files and the qa scripts) (baseline 106; the extra ones are structural warnings in new files and in the added `qa/` scripts; none are errors).
- `npm run qa:smoke` (Playwright + Chromium, production build, **mocked API** because no backend was available): 40/40 checks pass: theme toggle/persistence/system preference, palette navigation and actions, editor highlight/indent/focus-escape, recently viewed, no runtime JS errors, no horizontal overflow at 390px (2 pages), reduced-motion behaviour. A separate check confirmed the mobile drawer opens and navigates.
- **Not tested**: real login/registration, real backend data, aptitude and mock-test sessions, admin pages, PDF preview, Safari/Firefox, a real installed PWA, screen-reader behaviour, 320/768/1024px widths.

## H. Run
```
npm install
npm run dev          # http://localhost:5173 (proxies /api to :5000)
npm run build && npm run preview
npx playwright install chromium && npm run qa:smoke   # optional
```

## I. Remaining work / known limits
- Dark mode is applied by remapping the existing colour scale; most pages should be correct but only the pages in the smoke test (landing, login, dashboard, coding) were visually reviewed. Expect small contrast tweaks on pages not yet viewed (admin tables, progress charts with inline SVG hex colours, mock/aptitude sessions).
- ~111 inline hex colours in JSX (mostly chart/SVG strokes) were not converted.
- JWT remains in `localStorage` (existing design); an httpOnly-cookie flow needs backend work.
- Service worker caches only hashed static assets and the shell; bump `VERSION` in `public/sw.js` if you change its rules.
