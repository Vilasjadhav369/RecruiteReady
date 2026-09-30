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

## Environment Variables

See `backend/.env.example` for required backend variables.
Never commit `.env` files.

---

## License

Private — All rights reserved.
