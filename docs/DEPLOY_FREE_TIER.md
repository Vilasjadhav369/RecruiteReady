# RecruitReady Free-Tier Deployment Guide (Test Version)

This guide provides click-by-click instructions for deploying a test version of **RecruitReady** using free-tier cloud infrastructure for a small pool of testers (dozens of users).

---

## Architecture Overview

```
                      +---------------------------------------+
                      |          Render Static Site           |
                      |        (recruitready-frontend)        |
                      +-------------------+-------------------+
                                          |
                                          | HTTPS API Requests
                                          v
                      +---------------------------------------+
                      |         Render Web Service            |
                      |         (recruitready-backend)        |
                      +----------+-----------------+----------+
                                 |                 |
                MongoDB Atlas    |                 | SMTP (Port 587)
               M0 Free Cluster   |                 v
                      v          |         +---------------+
          +----------------------+         |  Gmail SMTP   |
          |  AWS ap-south-1      |         | (App Password)|
          |  (Mumbai, India)     |         +---------------+
          +----------------------+
```

### Free-Tier Limits Reference

| Service | Resource Tier | Key Limits |
| :--- | :--- | :--- |
| **Render Web Service** | Free (`plan: free`) | 512 MB RAM, 0.1 vCPU, 750 free instance hours/month. **Spins down after 15 minutes of inactivity** (~50s cold start). **Outbound SMTP blocked** (see alert below). |
| **Render Static Site** | Free | 100 GB bandwidth/month, unlimited builds, global CDN. |
| **MongoDB Atlas** | M0 Sandbox Free Tier | 512 MB storage, shared RAM/vCPU, 500 max connections, no automated snapshot backups. |
| **Email Delivery** | Disabled in Test Mode | SMTP ports 25, 465, 587 are blocked on Render free tier. Use `EMAIL_VERIFICATION_REQUIRED=false`. |

> [!IMPORTANT]
> **Outbound SMTP is Blocked on Render Free Web Services:**
> Render no longer permits outbound traffic to SMTP ports (25, 465, 587) on free web services:
> [Render Changelog: Free web services will no longer allow outbound traffic to SMTP ports](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports)
>
> Consequently, **Gmail SMTP (and any traditional SMTP provider) CANNOT connect on Render's free tier**.
> For this free-tier test deployment:
> - Set `EMAIL_VERIFICATION_REQUIRED=false` on `recruitready-backend`.
> - Student registration marks accounts as verified immediately and does not send emails.
> - Logins do not require email verification.
> - Password reset requests safely return generic success notices and advise contacting the organiser.
> - The backend environment validator (`validateEnv`) does **NOT** require `EMAIL_*` variables when `EMAIL_VERIFICATION_REQUIRED=false`.
> - **Later Production Option:** When email delivery is desired, migrate to an **HTTPS-API email provider** (e.g. Resend, SendGrid REST API, or Postmark API over port 443), which works reliably across all cloud hosting tiers.

---

## Step 1: Provision MongoDB Atlas M0 Cluster

### 1.1 Create Account & Project
1. Navigate to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) and sign up or log in.
2. Under your Organization, click **New Project**, name it `RecruitReady-Test`, and click **Create Project**.

### 1.2 Deploy Free M0 Cluster
1. On the project overview page, click **Create**.
2. Select the **M0 (Free)** tier tile.
3. **Cloud Provider & Region**:
   - Cloud Provider: **AWS**.
   - Region: Select **Mumbai (`ap-south-1`)** (the closest free-tier region to India for minimal latency).
4. **Cluster Name**: Leave as `Cluster0` or enter `recruitready-test-cluster`.
5. Click **Create Deployment** (no credit card required).

### 1.3 Create Database User
1. In the Quickstart modal (or via **Security** > **Database Access** > **Add New Database User**):
   - **Authentication Method**: Password (SCRAM-SHA-1/256).
   - **Username**: e.g., `recruitready_app_user`.
   - **Password**: Generate an alphanumeric password (at least 20 characters). Avoid special characters like `@`, `:`, `/`, `?`, or `#` in the password as they must be URL-encoded in connection strings.
   - **Database User Privileges**: Select **Read and write to any database** or restrict to `readWrite@recruitready`.
2. Click **Create User**.

### 1.4 Configure Network Access & Understand Risks
1. Go to **Security** > **Network Access** > **Add IP Address**.
2. Click **Allow Access from Anywhere** (`0.0.0.0/0`), enter comment `Render Free Tier Dynamic IPs`, and click **Confirm**.

> [!WARNING]
> **Network Security Assessment:** Render's free tier assigns dynamic egress IP addresses from a large shared pool. Fixed egress IPs are only available on Render paid plans. Because Render free web services rotate egress IPs, allowing `0.0.0.0/0` is required for connectivity.
> 
> **Risk Mitigation:**
> - The database is protected by SCRAM authentication with your strong user password.
> - Never use administrative cluster credentials for the application.
> - **NEVER** commit or paste the connection string into git or chat. Store it strictly in Render's private environment variables.

### 1.5 Retrieve Connection String
1. Go to **Deployments** > **Database** and click **Connect** on your cluster.
2. Choose **Drivers** (Node.js, version 5.5 or later).
3. Copy the connection string format:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
4. Replace `<username>` and `<password>` with your database user credentials, and specify the database name `recruitready` right before the query parameters:
   ```
   mongodb+srv://recruitready_app_user:YourStrongPassword@cluster0.xxxxx.mongodb.net/recruitready?retryWrites=true&w=majority
   ```
5. Keep this string ready in a local password manager. Do not share it.

---

## Step 2: Configure Third-Party Integrations

### 2.1 Email Setup: SMTP Blocked on Render Free Tier (Set EMAIL_VERIFICATION_REQUIRED=false)

> [!WARNING]
> Render free web services block outbound connections on ports 25, 465, and 587. Attempting to connect to `smtp.gmail.com:587` on Render's free tier will trigger `connect ETIMEDOUT` or `ECONNREFUSED`.
> Reference: [Render Free Web Services SMTP Port Restriction](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports).

For this free-tier test version, **do not configure SMTP credentials**.
Instead, configure:
- `EMAIL_VERIFICATION_REQUIRED=false` on Render.

**Later Production Option (HTTPS-API Mail Provider):**
When transitioning beyond the free test deployment, integrate an email service with an HTTPS REST API (such as [Resend](https://resend.com) or SendGrid HTTP API) operating over port 443.

### 2.2 Google OAuth Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Create a project named `RecruitReady-Test`.
3. Go to **APIs & Services** > **OAuth consent screen**:
   - User Type: **External**.
   - App Name: `RecruitReady (Test Version)`.
   - User Support Email: your email.
   - Developer Contact: your email.
   - Add Test Users: Add email addresses of your initial testers (since the app will be in "Testing" publishing status).
4. Go to **APIs & Services** > **Credentials** > **Create Credentials** > **OAuth client ID**:
   - Application Type: **Web application**.
   - Name: `RecruitReady Web Client`.
   - **Authorized JavaScript origins**:
     - `https://recruitready-frontend.onrender.com` (your Render frontend static site domain)
     - `http://localhost:5173` (for local development)
5. Click **Create** and record the **Client ID** (used for both backend `GOOGLE_CLIENT_ID` and frontend `VITE_GOOGLE_CLIENT_ID`).

### 2.3 GitHub OAuth Setup
1. Open [GitHub Developer Settings](https://github.com/settings/developers) > **OAuth Apps**.
2. Click **New OAuth App**.
3. Fill in the fields:
   - **Application name**: `RecruitReady Test`
   - **Homepage URL**: `https://recruitready-frontend.onrender.com`
   - **Authorization callback URL**: `https://recruitready-backend.onrender.com/api/auth/github/callback`
4. Click **Register application**.
5. Note the **Client ID** (`GITHUB_CLIENT_ID`).
6. Click **Generate a new client secret** and note the **Client Secret** (`GITHUB_CLIENT_SECRET`).
7. Note `GITHUB_CALLBACK_URL`: `https://recruitready-backend.onrender.com/api/auth/github/callback`.

---

## Step 3: Deploy Backend on Render

### 3.1 Create Web Service
1. Log in to [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** > **Web Service**.
3. Connect your Git repository (`RecruitReady`).
4. Configure service basics:
   - **Name**: `recruitready-backend`
   - **Region**: Singapore or Frankfurt (choose the region closest to India).
   - **Branch**: `chore/deploy-prep` (or `main` after merging).
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm ci`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**

### 3.2 Advanced Settings
- **Health Check Path**: `/api/health`
- **Auto-Deploy**: Yes (triggers on push)

### 3.3 Set Environment Variables
In the **Environment Variables** section, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` | Enables production security and disables coding features. |
| `PORT` | `10000` | Port assigned by Render for incoming traffic. |
| `TRUST_PROXY` | `1` | Enables Express to trust Render's reverse proxy for secure cookies and rate limits. |
| `CODING_ENABLED` | `false` | Explicitly disables coding features in test deployment. |
| `EMAIL_VERIFICATION_REQUIRED` | `false` | **Required for test version.** Bypasses SMTP ports blocked on Render free tier. |
| `MONGODB_URI` | `mongodb+srv://...` | Full MongoDB connection string from Step 1.5. |
| `JWT_SECRET` | *`<32+ character hex>`* | Generate via `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. |
| `CLIENT_URL` | `https://recruitready-frontend.onrender.com` | URL of your frontend static site (no trailing slash). |
| `GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | OAuth Client ID from Step 2.2. |
| `GITHUB_CLIENT_ID` | *`<github_client_id>`* | OAuth Client ID from Step 2.3. |
| `GITHUB_CLIENT_SECRET` | *`<github_client_secret>`* | OAuth Client Secret from Step 2.3. |
| `GITHUB_CALLBACK_URL` | `https://recruitready-backend.onrender.com/api/auth/github/callback` | OAuth redirect URL. |

> [!NOTE]
> `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASSWORD`, and `EMAIL_FROM` are **NOT required** for this test version because `EMAIL_VERIFICATION_REQUIRED=false`. Render free web services block SMTP ports 25, 465, and 587. When transitioning to a production mailer, use an HTTPS REST API provider (e.g. Resend) over port 443.

5. Click **Create Web Service**. Wait for the initial deployment to build and report "Live".
6. Verify health check by visiting:
   `https://recruitready-backend.onrender.com/api/health`
   Expected response: `{"status":"ok", ...}`

---

## Step 4: Deploy Frontend on Render

### 4.1 Create Static Site
1. In Render Dashboard, click **New +** > **Static Site**.
2. Connect the same Git repository.
3. Configure settings:
   - **Name**: `recruitready-frontend`
   - **Branch**: `chore/deploy-prep` (or `main`)
   - **Root Directory**: `frontend`
   - **Build Command**: `npm ci && npm run build`
   - **Publish Directory**: `dist`

### 4.2 Configure SPA Routing Rewrites
Single-page React apps require client-side routing rewrites so deep links (e.g. `/privacy`, `/terms`, `/dashboard`) do not return 404s.
1. In the static site dashboard, go to **Redirects/Rewrites**.
2. Add a rewrite rule:
   - **Type**: `Rewrite`
   - **Source**: `/*`
   - **Destination**: `/index.html`
3. Click **Save Changes**.

### 4.3 Set Frontend Environment Variables
In the **Environment Variables** section of the Static Site, add:

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_API_URL` | `https://recruitready-backend.onrender.com/api` | Absolute URL to the backend API. |
| `VITE_GOOGLE_CLIENT_ID` | `xxx.apps.googleusercontent.com` | Same Google Client ID as backend. |
| `VITE_ENABLE_CODING` | `false` | Explicitly hides coding UI elements in frontend. |

4. Click **Create Static Site** (or **Manual Deploy** > **Deploy latest commit**).
5. Once complete, visit `https://recruitready-frontend.onrender.com`.

---

## Step 5: Configure Free Uptime Monitor

Render free web services enter sleep mode after 15 minutes of inactivity. When a user visits an idle app, the first request experiences a ~50-second cold start delay.

To maintain active status during tester operating hours:
1. Sign up for a free monitoring service like [cron-job.org](https://cron-job.org/) or [UptimeRobot](https://uptimerobot.com/).
2. Create a new monitor / cron job:
   - **Type**: HTTP (GET)
   - **URL**: `https://recruitready-backend.onrender.com/api/health`
   - **Interval**: Every **12 minutes** (safely below Render's 15-minute idle threshold).
   - **Expected Status Code**: `200`
3. Save and enable the monitor.

---

## Step 6: First-Boot Checklist (Database Seeding)

Before testers log in, seed initial test data (Admin user, Aptitude questions, Companies, Resources, and 1 Aptitude-only Mock Test) using the safeguarded production seed script.

> [!IMPORTANT]
> - Run this command **ONCE** from your local developer machine.
> - Ensure your admin password is at least 12 characters.
> - Do not seed coding problems. `npm run seed:prod` automatically excludes coding problems to prevent leaking full starter solutions.

### 6.1 Execute Production Seed

In PowerShell:
```powershell
$env:ALLOW_PROD_SEED="1"
$env:ADMIN_EMAIL="admin@yourdomain.com"
$env:ADMIN_PASSWORD="YourStrongAdminPassword123!"
$env:MONGODB_URI="mongodb+srv://recruitready_app_user:YourStrongPassword@cluster0.xxxxx.mongodb.net/recruitready?retryWrites=true&w=majority"

npm run seed:prod

# Clear variables immediately from shell session
Remove-Item Env:ALLOW_PROD_SEED
Remove-Item Env:ADMIN_EMAIL
Remove-Item Env:ADMIN_PASSWORD
Remove-Item Env:MONGODB_URI
```

In Bash:
```bash
ALLOW_PROD_SEED=1 \
ADMIN_EMAIL="admin@yourdomain.com" \
ADMIN_PASSWORD="YourStrongAdminPassword123!" \
MONGODB_URI="mongodb+srv://recruitready_app_user:YourStrongPassword@cluster0.xxxxx.mongodb.net/recruitready?retryWrites=true&w=majority" \
npm run seed:prod
```

### 6.2 Verify Initial Seeding
1. Visit `https://recruitready-frontend.onrender.com/login`.
2. Sign in with the seeded admin credentials.
3. Check **Admin Dashboard**:
   - Verify Aptitude questions are present.
   - Verify Companies and Resources are populated.
   - Verify exactly 1 Aptitude-only Mock Test is present and published.
   - Confirm coding questions/tests are not accessible.
4. Test student registration:
   - Visit `/register`.
   - Verify the required consent checkbox and links to `/privacy` and `/terms`.
   - Submit registration and verify successful account creation.
   - In the student shell, verify the dismissible "Test version" banner is visible.

---

## Step 7: Weekly Database Backups (`mongodump`)

Because MongoDB Atlas M0 free clusters do not include automated snapshot backups, execute a manual backup weekly.

### 7.1 Prerequisites
Download and install [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools) (which includes `mongodump` and `mongorestore`).

### 7.2 Backup Command

In PowerShell:
```powershell
$backupDate = Get-Date -Format "yyyyMMdd-HHmm"
$uri = "mongodb+srv://recruitready_app_user:YourStrongPassword@cluster0.xxxxx.mongodb.net/recruitready?retryWrites=true&w=majority"

mongodump --uri="$uri" --archive="recruitready-backup-$backupDate.gz" --gzip
```

In Bash:
```bash
BACKUP_DATE=$(date +%Y%m%d-%H%M)
URI="mongodb+srv://recruitready_app_user:YourStrongPassword@cluster0.xxxxx.mongodb.net/recruitready?retryWrites=true&w=majority"

mongodump --uri="$URI" --archive="recruitready-backup-${BACKUP_DATE}.gz" --gzip
```

Store the resulting `.gz` archive file in secure off-site cloud storage (e.g., Google Drive or AWS S3).

---

## Step 8: Rollback Procedures

### 8.1 Roll Back Render Application Code
If a newly deployed commit introduces errors:
1. In the Render Dashboard, go to **recruitready-backend** (or **recruitready-frontend**).
2. Click **Events** or **Deploys**.
3. Find the previous successful deployment.
4. Click the three dots (`...`) next to the commit and select **Rollback to this deploy**.
5. Render immediately switches traffic back to the prior build artifact.

### 8.2 Restore Database from Backup
If database corruption occurs or a rollback requires reverting database state:

> [!CAUTION]
> The `--drop` flag drops existing collections in the database before restoring. Ensure all stakeholders are notified before performing a drop restore.

```bash
mongorestore --uri="mongodb+srv://recruitready_app_user:YourStrongPassword@cluster0.xxxxx.mongodb.net/recruitready?retryWrites=true&w=majority" \
  --archive="recruitready-backup-YYYYMMDD-HHMM.gz" \
  --gzip \
  --drop
```
