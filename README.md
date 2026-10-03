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
| 7     | Aptitude Practice                              | Planned     |
| 8     | Coding Practice                                | Planned     |
| 9     | Mock Tests                                     | Planned     |
| 10    | Company Preparation                            | Planned     |
| 11    | Analytics & Reports                            | Planned     |
| 12    | Advanced Platform Moderation                   | Planned     |

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

## License

Private — All rights reserved.
