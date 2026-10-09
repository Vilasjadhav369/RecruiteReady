# RecruitReady — Placement Preparation Portal

> Prepare Smarter. Get Placement Ready.

A full-stack placement preparation platform for college students.
Practice aptitude, master coding, prepare for companies, take mock tests, and track your journey.

---

## Tech Stack

| Layer    | Technology                                          |
|----------|-----------------------------------------------------|
| Frontend | React, Vite, Tailwind CSS v4, React Router, Axios  |
| Backend  | Node.js, Express.js, REST API, JWT                  |
| Database | MongoDB, Mongoose                                   |
| Auth     | JWT + bcrypt (Phase 4+)                             |

---

## Project Structure

```
RecruitReady/
├── frontend/          # React + Vite application
│   └── src/
│       ├── components/   # Shared UI components
│       ├── layouts/      # Page layout wrappers
│       ├── pages/        # Route-level page components
│       ├── routes/       # Route definitions
│       ├── services/     # API service layer (Axios)
│       ├── hooks/        # Custom React hooks
│       ├── utils/        # Utility functions
│       └── data/         # Static data / constants
├── backend/           # Node.js + Express API server
│   └── src/
│       ├── config/       # Database and app configuration (db.js)
│       ├── controllers/  # Route handler logic
│       ├── middleware/   # Custom middleware (errorHandler.js, notFound.js)
│       ├── models/       # Mongoose models (User, Company, etc.)
│       ├── routes/       # API route definitions (health.js)
│       ├── services/     # Business logic services
│       └── utils/        # Utility functions
├── .gitignore
└── README.md
```

---

## Local Development — MongoDB

To set up the database and run the backend locally:

1. **Prerequisite**: Ensure MongoDB Community Server is installed and running locally on port `27017`.
   - Windows Service check: `Get-Service -Name "*mongo*"`
   - CLI check: `mongosh --eval "db.version()"`
2. **Environment Configuration**: Create `backend/.env` based on `backend/.env.example`:
   ```bash
   cd backend
   cp .env.example .env
   ```
3. **Set MONGODB_URI**: Ensure `MONGODB_URI` points to your local database:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/recruiteready
   JWT_SECRET=development_secret_change_later
   CLIENT_URL=http://localhost:5173
   NODE_ENV=development
   ```
4. **Install Dependencies & Start Backend**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
5. **Seed Initial Admin Account (Optional)**:
   ```bash
   npm run seed:admin
   ```
   Creates the initial platform administrator account using `ADMIN_EMAIL` and `ADMIN_PASSWORD` defined in `.env`.

6. **Verify Health Endpoints**:
   - API & DB status: `GET http://localhost:5000/api/health`
   - Dedicated DB status: `GET http://localhost:5000/api/health/db`

---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- npm >= 9.x
- MongoDB (Running locally on default port 27017)

### Backend

```bash
cd backend
npm install
npm run dev
```

- Server runs at: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Database check: `http://localhost:5000/api/health/db`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

- Application runs at: `http://localhost:5173`

---

## Google Sign-In Setup (Google Identity Services)

RecruiteReady features official Google Identity Services integration with cryptographically verified ID tokens (`google-auth-library`), automated account linking by verified email, and strict role protection (`student`).

To enable Google Sign-In:

### 1. Create Google Cloud OAuth 2.0 Web Credentials
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select your Google Cloud project.
3. Navigate to **APIs & Services** > **Credentials**.
4. Configure the **OAuth consent screen**:
   - User Type: **External** (or Internal for Google Workspace orgs).
   - App Name: `RecruitReady`
   - User support email & Developer contact email: your email address.
   - Scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`.
5. Under **Credentials**, click **Create Credentials** > **OAuth client ID**:
   - Application type: **Web application**
   - Name: `RecruitReady Web Client`
   - **Authorized JavaScript origins**:
     - `http://localhost:5173` (for local development)
     - `https://your-domain.com` (for production)
   - Click **Create**.
6. Copy the **Client ID** (e.g. `xxxxxxxxxxxx-xxxxxxxxxxxxxxxx.apps.googleusercontent.com`).

### 2. Configure Environment Variables
- **Frontend** (`frontend/.env`):
  ```env
  VITE_GOOGLE_CLIENT_ID=your_client_id_from_google_cloud.apps.googleusercontent.com
  ```
- **Backend** (`backend/.env`):
  ```env
  GOOGLE_CLIENT_ID=your_client_id_from_google_cloud.apps.googleusercontent.com
  ```

*(Note: Never place OAuth Client Secrets or JWT secrets in the frontend environment file.)*

### 3. Run Verification Tests
```bash
cd backend
npm test
```
All security and authentication integration tests should pass with 0 failures.

---

## GitHub Login Setup (OAuth 2.0 Web Application)

RecruiteReady features GitHub OAuth 2.0 authentication with cryptographically random state verification (CSRF protection), email verification via GitHub's API (`/user/emails`), safe account linking, and strict student role enforcement.

To enable GitHub Login:

### 1. Create a GitHub OAuth App
1. Go to your GitHub account **Settings** > **Developer settings** > **OAuth Apps** (or directly visit [https://github.com/settings/developers](https://github.com/settings/developers)).
2. Click **New OAuth App** (or **Register a new application**).
3. Fill in the application details:
   - **Application name**: `RecruitReady`
   - **Homepage URL**: `http://localhost:5173`
   - **Application description** (optional): `Placement Preparation Portal`
   - **Authorization callback URL**:
     ```text
     http://localhost:5000/api/auth/github/callback
     ```
4. Click **Register application**.

### 2. Generate Client Secret
1. On your newly created application page, copy the **Client ID**.
2. Click **Generate a new client secret** and copy the resulting **Client Secret**.

### 3. Configure Backend Environment Variables
In [`backend/.env`](backend/.env):
```env
GITHUB_CLIENT_ID=your_github_client_id_here
GITHUB_CLIENT_SECRET=your_github_client_secret_here
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback
```
*(Note: Never expose `GITHUB_CLIENT_SECRET` to the frontend or commit it to version control.)*

### 4. Start Local Servers & Test
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Visit `http://localhost:5173/login` and click **Continue with GitHub** to authenticate!

---

## Password Reset & Email Verification

RecruiteReady features enterprise-grade password recovery and email verification built directly into the authentication architecture with anti-enumeration protection and SHA-256 token hashing.

### Security Highlights
- **Anti-Enumeration**: Both `/api/auth/forgot-password` and `/api/auth/resend-verification` return identical generic success messages regardless of whether the email exists, preventing user discovery.
- **SHA-256 Token Storage**: Tokens are generated as 64-character cryptographically secure hex strings (`crypto.randomBytes(32)`). Only the SHA-256 hash is stored in MongoDB with `select: false`. Plaintext tokens are never stored.
- **One-Time Use & Invalidation**: Both reset and verification tokens are strictly single-use and invalidated immediately upon successful consumption or subsequent requests.
- **Short Expiration Windows**: Password reset links expire after 20 minutes; email verification links expire after 24 hours.
- **Provider Auto-Verification**: Google and GitHub OAuth users with verified emails from their providers are automatically marked as verified (`emailVerified: true`).

### Email Service Configuration (`backend/.env`)

In development, emails are safely logged directly to the server terminal with full clickable URLs if SMTP is not configured.

To enable live email delivery via SMTP (e.g., SendGrid, Brevo, AWS SES, or Gmail App Password):
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_smtp_username@gmail.com
EMAIL_PASSWORD=your_smtp_app_password
EMAIL_FROM="RecruitReady <no-reply@recruiteready.com>"
```

### Endpoints
- `POST /api/auth/forgot-password`: Generates reset token and dispatches reset link (rate-limited).
- `POST /api/auth/reset-password`: Consumes reset token and sets new bcrypt-hashed password (min 8 chars).
- `POST /api/auth/verify-email`: Consumes verification token and marks email verified.
- `POST /api/auth/resend-verification`: Issues fresh verification link with anti-enumeration handling.

---

## Development Phases

| Phase | Description                                    | Status      |
|-------|------------------------------------------------|-------------|
| 1     | Project Foundation + Dev Rules                 | Complete    |
| 2     | Premium Landing Page                           | Complete    |
| 2.1   | Visual Polish & Responsive Quality Check       | Complete    |
| 3     | Backend Foundation + MongoDB Architecture      | Complete    |
| 4     | Authentication (JWT + bcrypt)                  | Complete    |
| 5     | Student Dashboard                              | Complete    |
| 6     | Admin Foundation & Question Bank Management    | Complete    |
| 7     | Aptitude, Coding & Mock Tests Practice         | Complete    |
| 8     | Company Preparation 2.0                        | Complete    |
| 9     | Admin Productivity 2.0                         | Complete    |
| 10    | Performance, Observability & Production Hardening | Complete (Local) |

---

## Production Deployment Prerequisites

Before deploying RecruiteReady to staging or production infrastructure, ensure the following configuration requirements and build steps are satisfied:

### 1. Frontend Environment Variables (`frontend/`)

| Variable | Required in Prod | Description | Example / Placeholder |
| :--- | :--- | :--- | :--- |
| `VITE_API_URL` | **Yes** (if separate domain) | Base URL for backend API including `/api` path. In local dev, defaults to `/api` (leveraging Vite dev proxy). | `https://api.yourdomain.com/api` or `/api` |

Create `frontend/.env.production` (or supply via your hosting platform's build environment variables):
```env
VITE_API_URL=YOUR_BACKEND_URL/api
```

### 2. Backend Environment Variables (`backend/`)

| Variable | Required in Prod | Secret? | Description | Example / Placeholder |
| :--- | :--- | :--- | :--- | :--- |
| `NODE_ENV` | **Yes** | No | Set to `production` to suppress debug stack traces. | `production` |
| `PORT` | Optional | No | Server listen port. Managed automatically by PaaS hosts. Defaults to 5000. | `5000` |
| `MONGODB_URI` | **Yes** | **Yes** | Connection string for MongoDB Atlas / hosted database. | `mongodb+srv://<user>:<password>@cluster.mongodb.net/recruiteready?retryWrites=true&w=majority` |
| `JWT_SECRET` | **Yes** | **Yes** | Cryptographically strong secret key (min 64 chars). | `YOUR_JWT_SECRET` |
| `JWT_EXPIRES_IN`| Optional | No | Token lifetime string. Defaults to `7d`. | `7d` |
| `CLIENT_URL` | **Yes** | No | Allowed frontend origin(s) for CORS. Comma-separated if multiple domains. | `YOUR_FRONTEND_URL` (e.g. `https://app.yourdomain.com,https://yourdomain.com`) |
| `CODE_EXECUTION_URL` | Optional | No | External code execution sandbox (e.g. Judge0 instance). | `https://judge0.yourdomain.com` |

Example production configuration for backend PaaS (Render / Railway / ECS / VPS):
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=YOUR_MONGODB_URI
JWT_SECRET=YOUR_JWT_SECRET
JWT_EXPIRES_IN=7d
CLIENT_URL=YOUR_FRONTEND_URL
```

### 3. Database Requirement (MongoDB)
- Production requires a secure MongoDB instance (e.g. MongoDB Atlas M0/M10+ or hosted replica set).
- IP Access List must allow connections from the backend host's public IP range (or 0.0.0.0/0 with robust database user authentication).
- Do not run development seed scripts (`seedDevContent.js` / `seedAdmin.js`) against production databases without review.

### 4. CORS Requirement
- `CLIENT_URL` must match the exact protocol, domain, and port of the deployed frontend.
- Do NOT use wildcards (`*`) when credentials (`withCredentials: true`) are enabled.
- Comma-separated origins are supported for custom domains (e.g. root and `www` subdomains).

### 5. Build & Startup Commands

#### Frontend Build
```bash
cd frontend
npm install
npm run build
```
- Output directory: `frontend/dist/`
- Serve with any static site host (Vercel, Netlify, Cloudflare Pages, Nginx, AWS S3 + CloudFront).

#### Backend Start
```bash
cd backend
npm install --omit=dev
npm start
```
- Start script runs: `node src/server.js` (production-ready; does not use nodemon).
- Verify deployment health via: `GET YOUR_BACKEND_URL/api/health`

---

## Authentication & Session Security Architecture

RecruitReady incorporates a production-hardened hybrid authentication and session management architecture:

### 1. Hybrid JWT + Server-Side Session Tracking
- **JWT with Pinned Algorithm**: JWT tokens are signed and verified strictly using `HS256` (`algorithms: ['HS256']`). Token headers and payloads are protected against algorithmic substitution attacks (`none` / asymmetric confusion).
- **Session Model & Tracking**: Every authentication event (`login`, `register`, `googleLogin`, `githubCallback`) creates an active session document in MongoDB (`Session` collection) recording device info, browser, IP address, creation time, and expiration.
- **Bcrypt Token Hash Bounding**: A SHA-256 / bcrypt hash of the token is bound to the session. Protected routes verify the token cryptographically and enforce that the session exists and has not been revoked (`revokedAt: null`).
- **Instant Server-Side Revocation**:
  - `POST /api/auth/logout`: Revokes the active session immediately on the server. Old tokens cannot be replayed.
  - `POST /api/auth/logout-all`: Revokes all other sessions across devices while retaining the current session.
  - `DELETE /api/auth/sessions/:id`: Revokes a specific device session with strict user-ownership validation.
  - `PATCH /api/auth/change-password`: Validates current password, updates the password hash, and automatically revokes all other active sessions across devices.

### 2. Multi-Layer Threat Defenses
- **HTTP Security Headers**: Express is hardened with `helmet` (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-DNS-Prefetch-Control`, `Referrer-Policy: strict-origin-when-cross-origin`).
- **NoSQL Injection Defense**: Recursive sanitization middleware strips MongoDB query operators (`$ne`, `$gt`, `$where`, etc.) and object key paths containing `$` or `.`.
- **CORS Protection**: Dynamic origin validation strictly enforces allowed clients from `CLIENT_URL` (no wildcard `*` with credentials). Unauthorized origins receive `403 Forbidden`.
- **Rate Limiting**: Tiered express-rate-limit protection on sensitive auth endpoints (`/api/auth/*` max 20 requests per 15 min).
- **Object Ownership & Privilege Escalation Defenses**: Strict authorization checks verify that attempts, submissions, and profiles are only accessible and modifiable by their owner. Protected profile updates strictly whitelist editable fields (`firstName`, `lastName`, `college`, `branch`, `graduationYear`, `bio`, `profilePhoto`, `skills`, `targetRole`), completely ignoring role, verification, or status overrides.
- **Audit Logging**: Sensitive events (`LOGIN_SUCCESS`, `LOGIN_FAILED`, `LOGOUT`, `PASSWORD_CHANGE_SUCCESS`, `SESSION_REVOKED`, `UNAUTHORIZED_ACCESS_ATTEMPT`) are sanitized and recorded in MongoDB `AuditLog` collection.

### 3. Account Security UI (`/profile`)
The student profile includes an integrated Account Security management panel:
- **Connected Accounts**: Visual status badges for Local Email, Google Identity, and GitHub OAuth with creation/link dates.
- **Email Verification Status**: Real-time verified badge or warning banner with one-click resend verification link.
- **Password Management**: Secure password update form requiring the verified current password.
- **Active Sessions Manager**: Lists all active logged-in devices with browser, operating system, IP address, and login time. Highlights "Current Device", provides individual session revocation buttons, and a global "Log Out All Other Devices" action.

### 4. Running the Security Test Suite
To run the automated 34-category security verification test suite:
```bash
cd backend
node src/scripts/testAuthSuite.js
```

---

## Student Onboarding & Personalized Experience

RecruitReady transforms generic student accounts into guided, personalized placement-preparation journeys with zero fabricated data:

### 1. Multi-Step Onboarding Architecture (`/onboarding`)
- **Focused, Clean 5-Step Flow**:
  - **Step 1: Basic Profile**: First name, last name, profile photo URL. Pre-filled from registration/OAuth and editable.
  - **Step 2: Academic Background**: Institutional name, controlled branch selection (CSE, IT, ECE, ENTC, EE, ME, CE, Other with custom text specification), and graduation year (2024–2030).
  - **Step 3: Preparation Level**: Controlled self-assessment level (`Just Starting`, `Beginner`, `Intermediate`, `Advanced`, `Placement Ready`).
  - **Step 4: Target Companies**: Live searchable company catalog loaded directly from MongoDB (`/api/companies`). Real company logos, names, and industry categorization with multi-select chips.
  - **Step 5: Preparation Goals**: Multi-select focus tracks (Aptitude, Coding, Core CS, Interview Preparation, Company Tracks, Mock Tests, Communication).
- **Zero Data Loss Navigation**: Back button preserves draft state. Page reloads preserve database-backed preferences.
- **Truthful Skip Flow**: "Skip for now" records `onboardingCompleted: true` without generating fake defaults, letting the dashboard honestly guide candidates to complete their profile.
- **Strict Endpoint Security (`PUT/PATCH /api/auth/onboarding`)**: Protected route strictly scoped to `req.user._id`. Rejects and ignores all privilege escalation or account hijacking attempts (`role`, `isActive`, `email`, `password`, `emailVerified`).

### 2. Dashboard Personalization & Information Architecture (`/dashboard`)
- **Dynamic Time-of-Day Greeting (`WelcomeBanner`)**: Answers *"Who am I?"* with "Good morning, [Name]", "Good afternoon, [Name]", or "Good evening, [Name]", active college/branch details, and current preparation level badge.
- **Continue Where You Left Off (`ContinuePreparing`)**:
  - Dynamically scans MongoDB for active in-progress timed assessments (`MockTestAttempt`, `AptitudeAttempt`) or recently attempted unaccepted coding challenges.
  - If unfinished work exists: renders direct "Resume" button routing directly into the active assessment session.
  - If no unfinished sessions exist: renders clean module quick-starter cards (Aptitude, Coding, Mock Tests, Companies).
- **Deterministic Next-Step Recommendation (`RecommendationCard`)**:
  - Answers *"What should I practice today?"* using deterministic non-AI rule prioritization:
    1. Unfinished timed assessment (Priority 1)
    2. Low-accuracy aptitude (<60%) or zero solved coding problems (Priority 2)
    3. Target company placement tracks (Priority 3)
    4. Incomplete profile prompt (Priority 4)
    5. Daily consistent practice challenge (Priority 5)
- **Transparent Placement Readiness Calculation (`PlacementReadinessCard`)**:
  - Answers *"How am I progressing?"* without ever fabricating numbers.
  - Returns `score: null` with status `insufficient_data` when zero practice attempts exist.
  - When candidate has practice data, computes a weighted formula:
    - Coding Solved Factor (max 30 pts)
    - Aptitude Accuracy Factor (max 30 pts)
    - Mock Test Performance Factor (max 25 pts)
    - Profile Completeness Factor (max 15 pts)
  - Displays transparent score `/ 100` and category breakdown.
- **Genuine Weak Areas Analysis (`WeakAreasCard`)**:
  - Answers *"What am I weak at?"* by analyzing real error distributions across completed aptitude attempts (<60% accuracy grouped by topic) and unresolved coding submissions. Zero fabricated weaknesses.
- **Target Companies Catalog (`TargetCompanies`)**:
  - Shows student's selected target companies with populated logos from MongoDB, industry tags, and direct links to recruitment archives.
- **Consecutive Preparation Streak (`PreparationStreak`)**:
  - Dynamically calculates consecutive active practice days leading up to today from real attempt timestamps (`AptitudeAttempt`, `CodingSubmission`, `MockTestAttempt`).
- **Profile Completion Tracker (`ProfileCompletionCard`)**:
  - Transparent 8-attribute evaluation across personal, academic, and preparation preferences with missing fields checklist.

### 3. Consolidated Dashboard API (`GET /api/dashboard/summary`)
A single parallelized endpoint resolves the entire dashboard summary in parallel queries without N+1 bottlenecks:
```json
{
  "profile": { "firstName": "Anand", "preparationLevel": "Intermediate", "onboardingCompleted": true },
  "profileCompletion": { "percentage": 100, "completedFields": [...], "missingFields": [] },
  "preparation": { "aptitude": { "completed": 3 }, "coding": { "solved": 5 }, "mockTests": { "completed": 1 } },
  "continueActivity": { "type": "mock_test", "actionLink": "/mock-tests/session/...", "progress": "5/20 questions" },
  "recommendation": { "title": "Resume In-Progress Assessment", "priority": 1, "actionLink": "..." },
  "readiness": { "score": 68, "status": "progressing", "breakdown": { "aptitudeScore": 24, "codingScore": 15, "mockTestScore": 14, "profileScore": 15 } },
  "weakAreas": { "items": [{ "name": "Quantitative Aptitude", "metric": "Accuracy: 52%", "actionLink": "/aptitude" }] },
  "targetCompanies": [{ "name": "Amazon", "hasTrack": true, "logoUrl": "..." }],
  "streakDays": 3,
  "recentActivity": [...],
  "upcomingTests": [...]
}
```

### 4. Running the Onboarding & Personalization Test Suite
To verify the 27 onboarding, security whitelisting, and dashboard personalization test criteria:
```bash
cd backend
node src/scripts/testOnboardingPersonalizationSuite.js
```

---

## Company Preparation 2.0 Architecture

RecruitReady features a fully integrated **Company Preparation 2.0** system that bridges company hiring patterns with genuine student preparation activities.

### 1. Data Models & Relationships
- **`Company`**: MongoDB model storing active company tracks with:
  - `name`, `slug`, `logoUrl`, `industry`, `description`, `website`, `careersUrl`
  - `roles`: Target job roles
  - `eligibility`: General text description of criteria
  - `eligibilityCriteria`: Structured evaluation criteria (`minCgpa`, `allowedBranches`, `allowedGraduationYears`, `maxBacklogs`)
  - `selectionProcess`: Ordered hiring rounds
  - `aptitudeTopics`, `codingTopics`, `interviewTopics`: Structured syllabus topics
  - `resources`: Curated study articles, guides, and practice links
  - `isFeatured`: Boolean flag for directory highlighting
  - `isActive`: Visibility control flag
- **`CompanyPreparationProgress`**: Granular, student-isolated checklist persistence:
  - Fields: `user`, `company`, `section` (`aptitude`, `coding`, `interview`, `resources`, `general`), `itemKey`, `completed`, `completedAt`
  - Unique compound index: `{ user: 1, company: 1, section: 1, itemKey: 1 }`
  - Lookup compound index: `{ user: 1, company: 1 }`

### 2. Verified Activity Integration
Company syllabus topics reflect genuine database activity:
- **Aptitude Topics**: Automatically cross-referenced with student's `AptitudeAttempt` records. If candidate completed sessions on matching topics/categories, the item is marked as completed and verified.
- **Coding Topics**: Automatically cross-referenced with student's accepted `CodingSubmission` records matching problem topics or categories.
- **Interview Topics & Study Resources**: Interactive persistent checklist backed by `CompanyPreparationProgress` with real-time toggle capability.

### 3. Student Academic Eligibility Match Engine
- Evaluates student profile (`cgpa`, `branch`, `graduationYear`, `backlogs`) against company cutoff criteria.
- Returns clear classification:
  - `likely_eligible`: Student meets all listed cutoff parameters.
  - `may_not_meet`: Student falls below minimum CGPA, active backlog cutoff, or non-listed branch.
  - `incomplete_data`: Student profile lacks necessary academic data for automated evaluation.
- **Mandatory Disclaimer**: Every eligibility response includes an explicit non-guarantee disclaimer: *"Eligibility criteria are indicative based on historical campus placement drives and do not guarantee an interview or offer."*

### 4. Step-by-Step Preparation Roadmap
Dynamically generated from real company records:
1. **Company Profile & Target Roles**: Understand company mission, industry domain, and target roles.
2. **Master Aptitude & Quantitative Topics**: Links directly to platform aptitude practice modules.
3. **Algorithmic Problem Solving**: Links directly to platform coding challenges filtered by domain.
4. **Technical & CS Interview Preparation**: Interactive checklist for core computer science concepts.
5. **Official Preparation Materials**: Curated preparation links, guides, and documentation.

### 5. API Endpoints
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| `GET` | `/api/companies` | Public / Student | List active companies with search, industry filter, and preparation area indicators |
| `GET` | `/api/companies/:id` | Public / Student | Get sanitized company details with target and bookmark status |
| `GET` | `/api/companies/:id/preparation` | Student | Get structured roadmap, topic practice status, progress, and eligibility |
| `GET` | `/api/companies/:id/progress` | Student | Get student's saved checklist records for company |
| `PATCH` | `/api/companies/:id/progress` | Student | Toggle checklist item (`section`, `itemKey`, `completed`) |
| `POST` | `/api/companies/:id/target` | Student | Atomically toggle company in student's target list |
| `POST` | `/api/companies/:id/check-eligibility` | Student | Evaluate student eligibility with optional interactive overrides |
| `GET` | `/api/admin/companies` | Admin | Manage companies with data completeness score (`quality.completenessPercentage`) |

### 6. Verification Test Suites
Run the automated verification suite for Company Preparation 2.0 (35 test points):
```bash
cd backend
node src/scripts/testCompanyPreparationSuite.js
```

---

## Admin Productivity 2.0

Comprehensive administrative operations suite engineered for security, high-throughput management, and operational clarity.

### 1. Key Capabilities
- **Platform Health & Metrics**: Live database ping latency, process heap memory consumption, system uptime, and collection volume diagnostics (`GET /api/admin/health`). Zero `NaN` safety fallbacks across all administrative dashboard widgets.
- **Pending Actions Hub**: Real-time breakdown of actionable items requiring staff attention (pending user reviews, inactive aptitude questions, inactive coding problems, unindexed companies, and unpublished mock tests).
- **Student Management & Advanced Filtering**:
  - Filter candidates by operational status (`active`/`inactive`), academic branch, graduation year, and email verification state.
  - Multi-column sort ordering (`createdAt`, `firstName`, `email`, `graduationYear`) with server-side pagination.
  - Multi-select bulk action toolbar with high-severity confirmation modals.
  - Safe CSV export with sanitized projection (`password`, `resetToken`, and sensitive session hashes strictly excluded) logged to the audit trail.
  - Safeguard preventing administrative accounts from ever being deactivated via student bulk operations.
- **Content Operations & Bulk Status**:
  - Aptitude Questions: Batch activate / deactivate (`PATCH /api/admin/aptitude/questions/bulk-status`).
  - Coding Problems: Batch activate / deactivate (`PATCH /api/admin/coding/problems/bulk-status`).
  - Companies: Batch activate / deactivate (`PATCH /api/admin/companies/bulk-status`).
  - Study Resources: Batch activate / deactivate (`PATCH /api/admin/resources/bulk-status`).
  - Mock Tests: Batch publish / unpublish (`PATCH /api/admin/mock-tests/bulk-status`) with validation guaranteeing empty tests (0 questions) cannot be published.
  - Review Moderation: Tabbed queue with batch approval / rejection recording administrator identity and moderation timestamps.
- **Audit Logging & Security Trail**:
  - Dedicated `/admin/audit-logs` interface with granular search, action categorization, severity tags, and structured JSON parameter inspection.
  - Strict RBAC: All administrative routes return `403 Forbidden` for student accounts.

### 2. API Endpoints
| Method | Endpoint | Access | Purpose |
|--------|----------|--------|---------|
| `GET` | `/api/admin/health` | Admin | Real-time system diagnostics (database ping ms, memory, uptime, collection counts) |
| `GET` | `/api/admin/audit-logs` | Admin | Paginated security audit trail with filtering by action, severity, and search |
| `GET` | `/api/admin/students` | Admin | Student directory with advanced filters (branch, graduation year, status, email verification) |
| `GET` | `/api/admin/students/export-csv` | Admin | Sanitize & export student records as CSV, audited in security logs |
| `PATCH` | `/api/admin/students/bulk-status` | Admin | Bulk activate/deactivate student accounts (admin role protected) |
| `PATCH` | `/api/admin/aptitude/questions/bulk-status` | Admin | Bulk activate/deactivate aptitude practice questions |
| `PATCH` | `/api/admin/coding/problems/bulk-status` | Admin | Bulk activate/deactivate coding problems |
| `PATCH` | `/api/admin/companies/bulk-status` | Admin | Bulk activate/deactivate company profiles |
| `PATCH` | `/api/admin/resources/bulk-status` | Admin | Bulk activate/deactivate study resources |
| `PATCH` | `/api/admin/mock-tests/bulk-status` | Admin | Bulk publish/unpublish mock tests with question count validation |
| `PATCH` | `/api/admin/reviews/bulk-moderation` | Admin | Bulk approve/reject reviews with moderator metadata |

### 3. Automated Verification Suites
Run the Admin Productivity 2.0 comprehensive verification suite (56 test points):
```bash
cd backend
node src/scripts/testAdminProductivitySuite.js
```

---

## Phase 10: Performance, Observability & Production Hardening

Phase 10 brings enterprise-level reliability, query performance, request tracing, observability, and automated regression coverage across the entire platform.

### 1. Key Engineering Enhancements
- **Readiness & Health Probes**:
  - `GET /api/ready`: Returns `200 OK` when the application is actively connected to MongoDB and ready to accept live traffic (`db: 'connected'`). Returns `503 Service Unavailable` during connection loss or recovery.
  - `GET /api/health`: Comprehensive system telemetry (uptime, environment, memory usage, timestamp).
  - `GET /api/health/db`: Dedicated database ping and state introspection.
- **Request Tracing (`requestTracing.js`)**:
  - Automatically generates cryptographically unique `X-Request-ID` headers (or propagates valid incoming tracing IDs).
  - Measures high-resolution request duration and attaches `X-Response-Time` to every HTTP response.
- **Structured JSON Logging (`logger.js`)**:
  - Standardized JSON logging format with severity levels (`info`, `warn`, `error`, `debug`).
  - Automatic recursive redaction of sensitive credentials, including `password`, `token`, `secret`, `jwt`, `authorization`, `cookie`, `sessionHash`, and `resetPasswordToken`.
- **Centralized Operational Error Handling (`errorHandler.js`)**:
  - Error classification into deterministic codes: `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_SERVER_ERROR`.
  - Attaches `requestId` to every error response for rapid troubleshooting.
  - Strictly hides internal stack traces and server file paths in production.
- **High-Performance MongoDB Indexing**:
  - Hardened compound and secondary indexes across all primary collections:
    - `User`: `{ role: 1, isActive: 1 }`, `{ role: 1, createdAt: -1 }`, `{ role: 1, branch: 1, graduationYear: 1 }`
    - `CodingProblem`: `{ isActive: 1, createdAt: -1 }`, `{ category: 1, isActive: 1 }`, `{ topics: 1, isActive: 1 }`
    - `Company`: `{ isActive: 1, isFeatured: -1, createdAt: -1 }`, `{ isActive: 1, name: 1 }`
    - `AuditLog`: `{ entityType: 1, createdAt: -1 }`, `{ severity: 1, createdAt: -1 }`, `{ createdAt: -1 }`
    - `Review`: `{ user: 1, createdAt: -1 }`, `{ status: 1, rating: -1 }`
    - `MockTest`: `{ isPublished: 1, difficulty: 1, createdAt: -1 }`
- **Graceful Shutdown & Process Resilience**:
  - `SIGTERM` and `SIGINT` signals initiate orderly server termination, allowing in-flight requests to complete before cleanly closing database connections.
  - Top-level `unhandledRejection` guards log fatal events via structured logging before clean exit.
- **Frontend Client Resilience (`api.js`)**:
  - Hardened Axios interceptor dispatches custom window events for `403 Forbidden` (`auth:forbidden`), `429 Too Many Requests` (`api:rate-limited`), and network timeout abortions.
  - Retains automatic `401 Unauthorized` token eviction and redirect to login.

### 2. Automated Test Matrix

| Command | Suite Scope | Verification Points |
| :--- | :--- | :--- |
| `npm run test` / `npm run test:quality` | Phase 10 Observability, Indexes & Hardening | 50 points |
| `npm run test:auth` | Authentication, Sessions & Security | 34 points |
| `npm run test:admin` | Admin Productivity 2.0 & Bulk Operations | 56 points |
| `npm run test:company` | Company Preparation 2.0 & Eligibility Engine | 35 points |
| `npm run test:all` | **Complete Platform Test Suite** | **175 points total** |

To execute the complete platform test suite:
```bash
cd backend
npm run test:all
```

> **Note on Deployment**: All Phase 10 optimizations and tests have been validated locally. Production deployment (Vercel, Render, Cloudflare, custom domains) has **not** been started and will be executed in a future dedicated phase.

---

## License

Private — All rights reserved.
