// Regression guard: verify /dashboard loads without error boundary or console errors
// with VITE_ENABLE_CODING=false for both a new user (empty data) and an active user (populated data).
import { chromium } from "playwright";
import { createServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(__dirname, "..");
const PORT = 5174;
const BASE_URL = `http://localhost:${PORT}`;

// Enforce coding feature disabled
process.env.VITE_ENABLE_CODING = "false";

const newUser = {
  _id: "u_new",
  firstName: "Priya",
  lastName: "Sharma",
  email: "priya@test.dev",
  role: "student",
  onboardingCompleted: true,
  consentAcceptedAt: new Date().toISOString(),
};

const activeUser = {
  _id: "u_active",
  firstName: "Rahul",
  lastName: "Verma",
  email: "rahul@test.dev",
  role: "student",
  onboardingCompleted: true,
  consentAcceptedAt: new Date().toISOString(),
};

const emptySummary = {
  profile: newUser,
  streakDays: 0,
  preparation: {
    aptitude: { attempted: 0, completed: 0 },
    coding: { attempted: 0, solved: 0 },
    mockTests: { attempted: 0, completed: 0 },
  },
  targetCompanies: [],
  recentActivity: [],
  upcomingTests: [],
  weakAreas: [],
  readiness: null,
  profileCompletion: { percentage: 20, missing: ["targetCompanies", "resume"] },
  preparationGoals: [],
};

const populatedSummary = {
  profile: activeUser,
  streakDays: 5,
  preparation: {
    aptitude: { attempted: 15, completed: 12 },
    coding: { attempted: 20, solved: 18 },
    mockTests: { attempted: 4, completed: 4 },
  },
  targetCompanies: [
    { _id: "c1", name: "Tata Consultancy Services", slug: "tcs", targetCount: 140 },
    { _id: "c2", name: "Infosys", slug: "infosys", targetCount: 95 },
  ],
  recentActivity: [
    { id: "act-1", type: "aptitude", title: "Quantitative Aptitude Practice", score: 85, createdAt: new Date().toISOString() },
    { id: "act-2", type: "mockTest", title: "Full TCS Mock 1", score: 72, createdAt: new Date().toISOString() },
    { id: "act-3", type: "coding", title: "Two Sum Problem", score: 100, createdAt: new Date().toISOString() },
  ],
  upcomingTests: [
    { id: "up-1", title: "Infosys National Qualifier Mock", startsAt: new Date(Date.now() + 86400000).toISOString() },
  ],
  weakAreas: [
    { topic: "Probability", accuracy: 40, recommendedAction: "Review formulas and practice 10 questions" },
  ],
  readiness: {
    score: 74,
    status: "on_track",
    breakdown: {
      codingScore: 24,
      aptitudeScore: 22,
      mockTestScore: 18,
      profileScore: 10,
    },
  },
  profileCompletion: { percentage: 100, missing: [] },
  preparationGoals: ["aptitude", "core_cs"],
};

const ok = (data) => ({
  status: 200,
  contentType: "application/json",
  body: JSON.stringify({ success: true, data }),
});

async function setupMocks(page, user, summary) {
  await page.route("**/api/**", (route) => {
    const u = new URL(route.request().url());
    const p = u.pathname.replace(/^\/api/, "");

    if (p === "/auth/me") return route.fulfill(ok({ user }));
    if (p === "/dashboard/summary") return route.fulfill(ok(summary));
    if (p === "/notifications/unread-count") return route.fulfill(ok({ unreadCount: 0 }));
    if (p === "/notifications") return route.fulfill(ok({ notifications: [], pagination: {} }));
    if (p === "/search") return route.fulfill(ok({ companies: [], coding: [], resources: [], mockTests: [], aptitude: [] }));
    if (p === "/goals") return route.fulfill(ok({ goals: summary.preparationGoals || [] }));
    if (p === "/config/public" || p === "/public-config") return route.fulfill(ok({ emailVerificationRequired: true }));
    return route.fulfill(ok({}));
  });
}

async function runScenario(browser, name, user, summary) {
  console.log(`\n--- Running scenario: ${name} ---`);
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on("pageerror", (err) => {
    console.error(`[${name} pageerror]:`, err.message);
    consoleErrors.push(err.message);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!/Failed to load resource|favicon\.ico|net::ERR/.test(text)) {
        console.error(`[${name} console.error]:`, text);
        consoleErrors.push(text);
      }
    }
  });

  await setupMocks(page, user, summary);

  await page.addInitScript(() => {
    localStorage.setItem("rr_token", "mock_jwt_token");
  });

  await page.goto(`${BASE_URL}/dashboard`, { waitUntil: "networkidle" });

  // 1. Verify ErrorBoundary did not catch an error
  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes("This page hit a problem")) {
    throw new Error(`FAIL [${name}]: Route ErrorBoundary rendered! ("This page hit a problem")`);
  }

  // 2. Verify dashboard header rendered
  const headerVisible = await page.locator("header").isVisible();
  if (!headerVisible) {
    throw new Error(`FAIL [${name}]: Dashboard header failed to render.`);
  }

  // 3. Fail on any console errors
  if (consoleErrors.length > 0) {
    throw new Error(`FAIL [${name}]: Caught ${consoleErrors.length} console error(s):\n${consoleErrors.join("\n")}`);
  }

  console.log(`PASS [${name}]: Dashboard rendered cleanly without errors.`);
  await context.close();
}

async function main() {
  console.log("Starting Vite dev server for regression testing...");
  const server = await createServer({
    root: frontendRoot,
    server: { port: PORT, strictPort: true },
    define: {
      "import.meta.env.VITE_ENABLE_CODING": JSON.stringify("false"),
    },
  });
  await server.listen();
  console.log(`Vite dev server running on ${BASE_URL}`);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });

    // Test Case 1: New user with empty dashboard data
    await runScenario(browser, "New User (Empty Data)", newUser, emptySummary);

    // Test Case 2: Active user with full dashboard data
    await runScenario(browser, "Active User (Populated Data)", activeUser, populatedSummary);

    console.log("\nAll regression checks PASSED!");
    process.exitCode = 0;
  } catch (err) {
    console.error("\nRegression test FAILED:", err.message);
    process.exitCode = 1;
  } finally {
    if (browser) await browser.close();
    await server.close();
  }
}

main();
