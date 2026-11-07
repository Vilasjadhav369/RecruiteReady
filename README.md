# RecruitReady — Campus Placement Preparation Platform

> Prepare Smarter. Get Placement Ready.

**RecruitReady** is an integrated full-stack MERN web application engineered for college engineering and MCA students preparing for campus recruitment drives. It unifies aptitude tests, algorithmic coding practice, company-specific preparation guides, full-length timed mock exams, student reviews, progress tracking, and cohort administration.

---

## Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 19, Vite 8 | React Router 7, TanStack Query 5, Axios, Swiss Monochrome Design System |
| **Styling** | Tailwind CSS v4 | `@tailwindcss/vite`, Space Grotesk & Inter font typography, CSS variables |
| **Backend** | Node.js 24, Express 4 | ES Modules (`"type": "module"`), REST API architecture |
| **Database** | MongoDB 7+, Mongoose 9 | Document store with compound indexing and aggregation pipelines |
| **Security** | Helmet, CORS, bcryptjs, JWT | Strict rate limiting, role-based authorization (`student`, `admin`), NoSQL sanitization |

---

## Prerequisites

- **Node.js**: `v20.x` or `v24.x` (`v24.13.0` recommended)
- **npm**: `v10.x` or `v11.x`
- **MongoDB**: Community Server `7.x` or higher running locally on port `27017` (or MongoDB Atlas URI)

---

## Setup & Running Runbook

### 1. Clone & Enter Project
```bash
git clone <repo-url>
cd RecruitReady
```

### 2. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env

# Seed initial admin account and sample test content
npm run seed:admin
npm run seed:content

# Start backend server (http://localhost:5000)
npm run dev
# Or for production:
npm start
```

### 3. Frontend Setup
```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment configuration (optional in dev, defaults to /api proxy)
cp .env.example .env

# Start frontend development server (http://localhost:5173)
npm run dev

# Production build and lint validation
npm run lint
npm run build
```

### 4. Testing Runbook

- **Unit Tests (Hermetic, No Database)**:
  ```bash
  cd backend
  npm test
  ```
  Runs fast, hermetic unit tests with Vitest (no MongoDB or external network connection required).

- **Integration Tests (Database Required)**:
  ```bash
  cd backend
  npm run test:integration
  # or run all test suites:
  npm run test:all
  ```
  > [!IMPORTANT]
  > Integration test suites (`test:integration`, `test:all`, etc.) connect to MongoDB and perform live database mutations. They must ALWAYS be executed against a dedicated throwaway test database, never against staging or production.

---

## Environment Variables

### Backend Configuration (`backend/.env`)

| Variable Name | Purpose | Required | Default / Example |
|---|---|:---:|---|
| `PORT` | HTTP port for Express API server | No | `5000` |
| `NODE_ENV` | Runtime environment mode | No | `development` |
| `MONGODB_URI` | MongoDB connection string | **Yes** | `mongodb://127.0.0.1:27017/recruiteready` |
| `JWT_SECRET` | Secret key used to sign and verify JSON Web Tokens | **Yes** | Strong 64-char hex secret |
| `JWT_EXPIRES_IN` | Validity duration of issued JWT tokens | No | `7d` |
| `CLIENT_URL` | Allowed frontend origin for CORS policy | **Yes** | `http://localhost:5173` |
| `TRUST_PROXY` | Number of upstream reverse proxy hops to trust | No | `0` (Local/Direct), `1` (Render, Nginx), `2` (Cloudflare + Nginx) |
| `GOOGLE_CLIENT_ID` | OAuth 2.0 Client ID for Google Social Sign-In | No | Google Cloud Console ID |
| `GITHUB_CLIENT_ID` | OAuth App Client ID for GitHub Sign-In | No | GitHub App Client ID |
| `GITHUB_CLIENT_SECRET` | OAuth App Secret for GitHub Sign-In | No | GitHub App Secret |
| `GITHUB_CALLBACK_URL` | Redirect callback URL for GitHub OAuth flow | No | `http://localhost:5000/api/auth/github/callback` |
| `EMAIL_HOST` | SMTP server host for sending password reset & verification emails | No | `smtp.example.com` (logs to console if omitted) |
| `EMAIL_PORT` | SMTP port | No | `587` |
| `EMAIL_USER` | SMTP username | No | `user@example.com` |
| `EMAIL_PASSWORD` | SMTP password | No | SMTP password |
| `EMAIL_FROM` | Sender display name and email address | No | `"RecruitReady Support" <no-reply@recruiteready.local>` |
| `CODE_EXECUTION_URL` | Endpoint of isolated external sandbox runner (Judge0 / Piston) | No | Optional HTTP runner URL |
| `ADMIN_EMAIL` | Initial admin account email for seeding | No | `admin@recruiteready.local` |
| `ADMIN_PASSWORD` | Initial admin account password for seeding | No | Secure dev password |

### Rate Limiting & Proxy Configuration

- **In-Memory Store Notice**: Rate limits are stored in-memory per Node.js process. When scaling horizontally across multiple Node.js instances, cluster workers, or serverless containers, an external distributed store such as Redis (`rate-limit-redis`) must be plugged into `createRateLimiter` to coordinate counters across instances.
- **Reverse Proxy & `TRUST_PROXY` Settings**:
  - **Local Development / Direct Exposure**: `TRUST_PROXY=0` (default). Disables proxy header spoofing; uses socket remote IP.
  - **Render**: `TRUST_PROXY=1` (Render terminates TLS at an ingress reverse proxy and forwards the real client IP in standard 1-hop proxy configuration).
  - **Nginx**: `TRUST_PROXY=1` (standard single-hop reverse proxy forwarding `X-Forwarded-For`).
  - **Cloudflare**: `TRUST_PROXY=1` (when traffic routes directly from Cloudflare to Node), or `TRUST_PROXY=2` (if traffic routes through Cloudflare -> Nginx -> Node).

### Frontend Configuration (`frontend/.env`)

| Variable Name | Purpose | Required | Default / Example |
|---|---|:---:|---|
| `VITE_API_URL` | Base URL for API requests | No | `/api` (uses Vite dev server proxy to localhost:5000) |
| `VITE_GOOGLE_CLIENT_ID` | Public Google Client ID for frontend button render | No | Safe public client ID |

---

## Project Structure

```text
RecruitReady/
├── backend/
│   ├── src/
│   │   ├── config/             # Database connection & env validation
│   │   ├── controllers/        # Domain business logic (Aptitude, Coding, Mock, Admin)
│   │   ├── middleware/         # Auth JWT, Role RBAC, Rate Limiting, Error Handling
│   │   ├── models/             # 16 Mongoose document schemas
│   │   ├── routes/             # Express API route declarations
│   │   ├── scripts/            # Database seeders and validation suites
│   │   ├── services/           # Code execution abstraction, email & auth services
│   │   ├── app.js              # Express application configuration and route assembly
│   │   └── server.js           # Express application entrypoint and server lifecycle
│   └── package.json
├── frontend/
│   ├── public/                 # Static assets and branding SVGs/PNGs
│   ├── src/
│   │   ├── components/         # Common UI, Admin, Dashboard, Search, Modals
│   │   ├── context/            # AuthContext & global session state
│   │   ├── hooks/              # Custom React hooks (sidebar, celebrate, motion)
│   │   ├── layouts/            # MainLayout, StudentLayout, AdminLayout shells
│   │   ├── pages/              # Domain pages (Aptitude, Coding, MockTests, Companies, etc.)
│   │   ├── routes/             # AppRoutes client router with protected guards
│   │   ├── services/           # Axios API client and domain service modules
│   │   ├── styles/             # Tailwind CSS tokens, motion, dark theme
│   │   └── index.css           # Swiss Monochrome CSS variable system
│   ├── vite.config.js
│   └── package.json
└── docs/                       # Verification runbooks & design specs
```

---

## Known Limitations & Verified Scope

1. **Sandboxed Code Execution Runner**: Arbitrary user code is **never** executed on the Node.js server process. All submissions are routed through `codeExecutionService.js`. If an external runner URL (`CODE_EXECUTION_URL`, e.g., Judge0 or Piston) is not configured in `.env`, submissions are safely stored in MongoDB and returned with status `"execution_unavailable"` ("Not evaluated").
2. **Unbuilt Conceptual Modules**: The following modules mentioned in conceptual marketing/roadmaps have **no implementation** in this codebase (no routes, controllers, models, or views):
   - **AI Placement Coach**
   - **Chatbot**
   - **Counselling**
3. **Community Scope**: Community features currently consist of moderated company placement reviews and interview difficulty ratings (`Review` model + `/reviews` page). Real-time discussion forums or peer chat threads are not part of the active system.
4. **Local SMTP**: In local development without SMTP credentials configured in `backend/.env`, password reset and email verification links are printed directly to the backend console logs.
