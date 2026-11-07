# RecruitReady — Local Verification Runbook

This runbook provides the exact terminal commands to verify the RecruitReady backend services, unit tests, security hardening, and integration suites on your local machine with an active MongoDB instance.

---

## 1. Prerequisites Check

Ensure your local MongoDB daemon is running:
```bash
# Check MongoDB status on default port 27017
mongosh --eval "db.runCommand({ ping: 1 })"
# Or on Windows PowerShell:
Test-NetConnection -ComputerName 127.0.0.1 -Port 27017
```

---

## 2. Run Fast Hermetic Unit Tests (No Database, No Network)

Vitest runs completely offline and hermetic unit tests covering application structure, error handling, Pino logging redaction, rate limiting policies, and authentication hardening:

```bash
cd backend
npm test
```

Expected output:
```text
 ✓ tests/sanitize.test.js (5 tests)
 ✓ tests/errorHandlerAndLogger.test.js (4 tests)
 ✓ tests/rateLimiter.test.js (4 tests)
 ✓ tests/authHardening.test.js (5 tests)
 ✓ tests/app.test.js (3 tests)

 Test Files  5 passed (5)
      Tests  21 passed (21)
```

---

## 3. Verify Route Manifest (No Database Required)

You can print the entire list of 133 registered routes from `src/app.js` without starting a database:

```bash
cd backend
node src/scripts/listRoutes.js
```

---

## 4. Start Backend API Server

Open a terminal window:
```bash
cd backend
npm install
npm run dev
# Or production entrypoint:
npm start
```

*Expected output: Structured JSON line from Pino logger confirming server running on configured `PORT` (default 5000).*

---

## 5. Verify Health & Diagnostic Probes

In a new terminal window:

### Bash / macOS / Linux:
```bash
# Basic liveness probe
curl -s http://localhost:5000/api/health | jq .

# Dedicated database status probe (sanitized: no credentials or hostnames exposed)
curl -s http://localhost:5000/api/health/db | jq .

# Readiness probe for Kubernetes / reverse proxies
curl -s http://localhost:5000/api/ready | jq .
```

### Windows PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health | ConvertTo-Json -Depth 4
Invoke-RestMethod -Uri http://localhost:5000/api/health/db | ConvertTo-Json -Depth 4
Invoke-RestMethod -Uri http://localhost:5000/api/ready | ConvertTo-Json -Depth 4
```

---

## 6. Verify Rate Limiting Policies (College Lab Simulation)

### Test A: Rapid Login Attempts (Account Lockout vs Shared IP)
Attempt 11 failed logins with the same email from the same IP:
```bash
for i in {1..11}; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"target_student@campus.edu","password":"wrongPassword!"}'
done
```
- Requests 1–10 return HTTP `401`.
- Request 11 returns HTTP `429` with JSON `{ "success": false, "message": "Too many failed login attempts...", "retryAfter": ... }` and `Retry-After` header.
- Immediately test a different student account from the same IP:
```bash
curl -s -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"other_student@campus.edu","password":"ValidPassword123!"}'
```
- Returns HTTP `200` (or `401` if credentials incorrect, but NOT `429`), confirming shared lab IP is not locked out for other students.

---

## 7. Run Full Integration Suites (Against Throwaway Test Database)

> [!WARNING]
> Integration test suites connect directly to MongoDB and mutate data. Never run them against staging or production. Set `MONGODB_URI` to a throwaway local database:

```bash
cd backend
export MONGODB_URI="mongodb://127.0.0.1:27017/recruitready_throwaway_test"

# Run single integration suite
npm run test:integration

# Run all integration suites
npm run test:all
```
