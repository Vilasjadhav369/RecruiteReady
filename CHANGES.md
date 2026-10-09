# RecruitReady frontend — what changed

## Critical fix
- **`index.css`**: the unlayered `*{margin:0;padding:0}` reset overrode every Tailwind v4 spacing utility
  (padding, margins, `mx-auto`, `space-*`), which flattened the whole UI. Removed it (Tailwind's preflight
  already resets) and moved base styles into `@layer base`.

## Performance
- Route-level code splitting (`React.lazy` + `Suspense`); main bundle was one 928 KB file, now split per page.
- Separate `react-vendor` / `http-vendor` chunks for better caching.
- Google Fonts moved from CSS `@import` to `<link>` with preconnect.

## Robustness
- `ErrorBoundary` around all routes (resets on navigation) — a page crash no longer white-screens the app.
- API layer now emits `auth:expired` on any 401 (except login/register); `AuthContext` clears the session so
  protected routes redirect to `/login`.
- `logout()` always clears local state, even if the network call fails.
- `AuthContext` value memoized (fewer re-renders).
- `Input` / `Textarea` / `Select` use `useId()` instead of `Math.random()` (stable ids, no hydration/a11y churn).

## UX / accessibility
- `Button` accepts `to` and renders a router `<Link>`; replaced 52 invalid `<a><button/></a>` nestings.
- Navbar "Features" / "About" now actually scroll (hash handling in `RouteScrollAndTitle`; added `#about`).
- Skip-to-content link on all three layouts; `scroll-margin-top` under the sticky header;
  `prefers-reduced-motion` respected.

## Design
- Homepage hero is now a split layout with the product preview (`DashboardPreview`, previously unused),
  sentence-case headline, shorter copy, balanced headings.

## Cleanup
- Lint warnings 125 → 73 (unused imports removed). Remaining are mostly `setState`-in-effect fetch patterns.

# Round 2 — premium pass

## Brand and tokens
- Brand moved from green to royal blue (#2563EB) with a navy/blue scale, per the original design brief.
  Green is kept only for success states (emerald badges, correct-answer styling on result pages).
- ~600 hardcoded hex classes (`bg-[#166534]` etc.) now use theme tokens: `bg-primary`, `text-primary-dark`,
  `bg-primary-soft`, `text-ink`, `text-ink-2`, `border-border`, `bg-background`. Change the brand once in `index.css` `@theme`.
- Inter is now self-hosted (`@fontsource-variable/inter`); no Google Fonts request. `theme-color` set to navy.

## Data and performance
- Added TanStack Query (`src/lib/queryClient.js`): 60s fresh cache, no retry on 4xx, no refetch on window focus.
- `CompanyListPage` migrated as the reference pattern: cached, debounced search (`useDebouncedValue`),
  previous results stay visible while paging, optimistic target-company toggle. Migrate other list pages the same way.

## UX
- `FeedbackProvider` / `useFeedback()` (`components/ui/FeedbackProvider.jsx`): app-wide toasts and promise-based confirm dialogs.
  Replaced all `alert()` / `window.confirm()` calls (mock test start errors, coding language switch, code reset).
- Page-enter animation (220ms) on student and admin content; honours `prefers-reduced-motion`.
- Aptitude session keyboard shortcuts: A–D or 1–4 answer, ←/→ move, M mark for review.

## Bug fixed
- `AptitudeSessionPage` rendered `<AptitudeIcon>` without importing it (ReferenceError on open). Imported.

## Not done (needs your decision or backend work)
- JWT still lives in localStorage; moving to an httpOnly cookie needs backend changes.
- Dark mode, splitting the 1,200–1,600-line admin pages, and a test suite (Vitest/Playwright) are still open.
- Remaining pages still use manual `useEffect` fetching; only Companies is on TanStack Query.
