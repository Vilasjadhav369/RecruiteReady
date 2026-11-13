# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.

## Upgrade notes (Swiss redesign pass)
See `docs/UPGRADE_REPORT.md` for what changed, what was verified, and what remains, and `docs/BACKEND_NEEDS.md` for backend-dependent features. Design spec: `docs/DESIGN_SYSTEM.md`. Theme (Light/Dark/System): `src/context/ThemeContext.jsx` + generated `src/styles/theme-dark.css` (`npm run gen:dark-theme`). Motion: `src/styles/motion.css`.

## Test Mode & Public Configuration (Free-Tier Deployment)
When deployed on Render's free tier with `EMAIL_VERIFICATION_REQUIRED=false`, the frontend dynamically detects runtime capabilities via `GET /api/public-config` (cached via TanStack Query):
- Hides email resend verification UI on `/verify-email` and `AccountSecurityTab`.
- Displays `"Password reset by email is off in this test version. Ask the organiser to reset it."` on the forgot password page.
- Degrades safely to default state if `/api/public-config` is unreachable.
- Direct outbound SMTP is blocked on Render free tier (see [Render SMTP Port Restriction](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports)); migration to an HTTPS-API provider (e.g. Resend) is the recommended path for production email.
