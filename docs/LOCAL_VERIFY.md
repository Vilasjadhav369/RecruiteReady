# RecruitReady — Local Verification Runbook

This runbook provides the exact terminal commands to verify the RecruitReady backend and frontend services on your local machine with an active MongoDB instance.

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

## 2. Start Backend API Server

Open a terminal window:
```bash
cd backend
npm install
npm run seed:admin
npm run dev
```

*Expected output: `Server running in development mode on port 5000` and `Connected to MongoDB successfully`.*

---

## 3. Verify Health Endpoint (`GET /api/health`)

In a new terminal window:

### Bash / macOS / Linux:
```bash
curl -s http://localhost:5000/api/health | jq .
```

### Windows PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/health | ConvertTo-Json -Depth 4
```

*Expected response:*
```json
{
  "status": "ok",
  "uptime": 12.5,
  "database": {
    "status": "connected"
  }
}
```

---

## 4. Register a New Student (`POST /api/auth/register`)

### Bash / macOS / Linux:
```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teststudent@example.com",
    "password": "Password123!",
    "firstName": "Alex",
    "lastName": "Sharma",
    "college": "PICT",
    "degree": "Computer Engineering",
    "graduationYear": 2026
  }' | jq .
```

### Windows PowerShell:
```powershell
$registerBody = @{
  email = "teststudent@example.com"
  password = "Password123!"
  firstName = "Alex"
  lastName = "Sharma"
  college = "PICT"
  degree = "Computer Engineering"
  graduationYear = 2026
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/auth/register `
  -Method POST `
  -ContentType "application/json" `
  -Body $registerBody | ConvertTo-Json -Depth 4
```

---

## 5. Login & Obtain JWT Token (`POST /api/auth/login`)

### Bash / macOS / Linux:
```bash
LOGIN_RES=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "teststudent@example.com", "password": "Password123!"}')

echo $LOGIN_RES | jq .

# Extract JWT token into shell variable
TOKEN=$(echo $LOGIN_RES | jq -r '.token')
echo "Token obtained: $TOKEN"
```

### Windows PowerShell:
```powershell
$loginBody = @{
  email = "teststudent@example.com"
  password = "Password123!"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri http://localhost:5000/api/auth/login `
  -Method POST `
  -ContentType "application/json" `
  -Body $loginBody

$loginRes | ConvertTo-Json -Depth 4

$TOKEN = $loginRes.token
Write-Host "Token obtained: $TOKEN"
```

---

## 6. Fetch Student Dashboard with Auth Header (`GET /api/dashboard`)

### Bash / macOS / Linux:
```bash
curl -s -X GET http://localhost:5000/api/dashboard \
  -H "Authorization: Bearer $TOKEN" | jq .
```

### Windows PowerShell:
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/dashboard `
  -Headers @{ Authorization = "Bearer $TOKEN" } | ConvertTo-Json -Depth 4
```

*Expected response includes:*
- `readinessScore` (0–100 integer)
- `recentActivity` (Array of recent practice attempts)
- `preparationLaunchpad` (Quick jump metrics for aptitude, coding, mock tests)
- `stats` (Totals and category breakdowns)

---

## 7. Start Frontend Dev Server

In another terminal window:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser:
- Log in with the registered credentials (`teststudent@example.com` / `Password123!`).
- Verify the Swiss Monochrome theme, sidebar toggle, dashboard widgets, and aptitude / coding problem lists.
