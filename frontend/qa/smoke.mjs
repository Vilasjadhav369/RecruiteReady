// Local running app smoke test: verifies that all student and admin routes
// render without console errors, uncaught exceptions, or "This page hit a problem" error boundary.
import { chromium } from "playwright";

const BASE_URL = process.env.APP_URL || "http://localhost:5173";
const QA_EMAIL = process.env.QA_EMAIL;
const QA_PASSWORD = process.env.QA_PASSWORD;
const QA_ADMIN_EMAIL = process.env.QA_ADMIN_EMAIL;
const QA_ADMIN_PASSWORD = process.env.QA_ADMIN_PASSWORD;

const isEmptyDbMode =
  process.argv.includes("--empty-db") ||
  process.argv.includes("--mock-empty") ||
  process.env.EMPTY_DB === "1" ||
  process.env.EMPTY_DB === "true" ||
  process.env.MOCK_EMPTY === "1" ||
  process.env.MOCK_EMPTY === "true";

if (!isEmptyDbMode && (!QA_EMAIL || !QA_PASSWORD)) {
  console.error("Missing required environment variables for smoke testing.");
  console.error(
    "Usage: QA_EMAIL=<email> QA_PASSWORD=<pass> [QA_ADMIN_EMAIL=<email> QA_ADMIN_PASSWORD=<pass>] [APP_URL=http://localhost:5173] npm run qa:smoke"
  );
  console.error(
    "Empty database mode: node qa/smoke.mjs --empty-db (or EMPTY_DB=true node qa/smoke.mjs)"
  );
  process.exit(1);
}

const STUDENT_ROUTES = [
  "/dashboard",
  "/profile",
  "/settings",
  "/notifications",
  "/saved",
  "/bookmarks",
  "/aptitude",
  "/aptitude/history",
  "/coding",
  "/coding/history",
  "/companies",
  "/resources",
  "/mock-tests",
  "/mock-tests/history",
  "/progress",
  "/reviews",
  "/leaderboard",
];

const ADMIN_ROUTES = [
  "/admin",
  "/admin/students",
  "/admin/aptitude",
  "/admin/coding",
  "/admin/companies",
  "/admin/resources",
  "/admin/mock-tests",
  "/admin/reviews",
  "/admin/analytics",
  "/admin/settings",
  "/admin/audit-logs",
  "/admin/notifications",
];

// Mock API payloads for empty-database verification of all admin routes
const MOCKED_EMPTY_ADMIN_RESPONSES = {
  "/api/auth/me": {
    success: true,
    data: {
      user: {
        _id: "admin-mock-id",
        firstName: "RecruitReady",
        lastName: "Admin",
        email: "admin@recruitready.edu",
        role: "admin",
        isActive: true,
        consentAcceptedAt: "2026-01-01T00:00:00.000Z",
      },
    },
  },
  "/api/auth/login": {
    success: true,
    data: {
      user: {
        _id: "admin-mock-id",
        firstName: "RecruitReady",
        lastName: "Admin",
        email: "admin@recruitready.edu",
        role: "admin",
        isActive: true,
      },
      token: "mock-jwt-token-admin",
    },
  },
  "/api/admin/dashboard": {
    success: true,
    data: {
      students: { total: 0, active: 0 },
      aptitude: { questions: 0, attempts: 0 },
      coding: { problems: 0, submissions: 0 },
      companies: { total: 0 },
      resources: { total: 0 },
      mockTests: { total: 0, attempts: 0 },
      reviews: { total: 0, pending: 0 },
      pendingActions: {
        pendingReviews: 0,
        inactiveQuestions: 0,
        inactiveProblems: 0,
        unpublishedMockTests: 0,
        totalPending: 0,
      },
      health: {
        dbStatus: "connected",
        uptimeSeconds: 3600,
        memoryUsageMb: 42,
      },
      activity: [],
    },
  },
  "/api/admin/health": {
    success: true,
    data: {
      dbStatus: "connected",
      uptimeSeconds: 3600,
      memoryUsageMb: 42,
    },
  },
  "/api/admin/students": {
    success: true,
    data: {
      students: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
      filters: { availableBranches: [], availableGraduationYears: [] },
    },
  },
  "/api/admin/aptitude": {
    success: true,
    data: {
      questions: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
      total: 0,
    },
  },
  "/api/admin/coding": {
    success: true,
    data: {
      problems: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
      total: 0,
    },
  },
  "/api/admin/companies": {
    success: true,
    data: {
      companies: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
      total: 0,
    },
  },
  "/api/admin/resources": {
    success: true,
    data: {
      resources: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
      total: 0,
    },
  },
  "/api/admin/mock-tests": {
    success: true,
    data: {
      mockTests: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
      total: 0,
    },
  },
  "/api/admin/reviews": {
    success: true,
    data: {
      reviews: [],
      counts: { pending: 0, approved: 0, rejected: 0, all: 0 },
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
    },
  },
  "/api/admin/analytics": {
    success: true,
    data: {
      summary: {
        totalStudents: 0,
        activeStudents: 0,
        aptitudeAttempts: 0,
        codingSubmissions: 0,
        mockAttempts: 0,
        overallAvgScore: 0,
      },
      activityTrend: [],
    },
  },
  "/api/admin/audit-logs": {
    success: true,
    data: {
      logs: [],
      pagination: { total: 0, page: 1, limit: 10, pages: 1 },
      filters: { availableActions: [], availableEntityTypes: [] },
    },
  },
  "/api/notifications": {
    success: true,
    data: {
      notifications: [],
      unreadCount: 0,
    },
  },
};

async function loginUser(page, email, password) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector('input[name="email"], input[type="email"]', { timeout: 10000 });
  await page.fill('input[name="email"], input[type="email"]', email);
  await page.fill('input[name="password"], input[type="password"]', password);
  await page.click('button[type="submit"]');
  // Wait for login redirection away from /login
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 15000 });
}

async function verifyRoutes(browser, roleName, email, password, routes) {
  console.log(`\n========================================`);
  console.log(`Running smoke checks for role: ${roleName} (${email})`);
  console.log(`========================================`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const collectedErrors = [];
  page.on("pageerror", (err) => {
    collectedErrors.push({ type: "pageerror", text: err.message || String(err) });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      // Ignore routine network connection / resource 404 noise if backend is idling
      if (!/Failed to load resource|net::ERR|favicon\.ico/.test(text)) {
        collectedErrors.push({ type: "console.error", text });
      }
    }
  });

  try {
    await loginUser(page, email, password);
  } catch (err) {
    console.error(`FAILED to log in as ${roleName}:`, err.message);
    await context.close();
    return [{ route: "/login", pass: false, errors: [`Login failed: ${err.message}`] }];
  }

  const results = [];

  for (const route of routes) {
    const routeErrors = [];
    const startIndex = collectedErrors.length;

    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      // Allow brief tick for React effects and subcomponents to mount
      await page.waitForTimeout(600);

      const hasCrashText = await page.evaluate(() => {
        return document.body.innerText.includes("This page hit a problem");
      });

      if (hasCrashText) {
        routeErrors.push("Error boundary triggered: 'This page hit a problem' detected on page");
      }

      const newErrors = collectedErrors.slice(startIndex);
      if (newErrors.length > 0) {
        for (const e of newErrors) {
          routeErrors.push(`[${e.type}] ${e.text}`);
        }
      }

      const pass = routeErrors.length === 0;
      results.push({ route, pass, errors: routeErrors });

      if (pass) {
        console.log(`  ✓ PASS: ${route}`);
      } else {
        console.error(`  ✗ FAIL: ${route}`);
        routeErrors.forEach((e) => console.error(`      - ${e}`));
      }
    } catch (err) {
      console.error(`  ✗ FAIL: ${route} (navigation error: ${err.message})`);
      results.push({ route, pass: false, errors: [err.message] });
    }
  }

  await context.close();
  return results;
}

/**
 * Empty Database Regression Guard:
 * Intercepts all backend API calls with empty database mock payloads.
 * Fails on any console.error, pageerror, or "This page hit a problem" error boundary.
 */
async function verifyEmptyDatabaseAdminRoutes(browser) {
  console.log(`\n========================================`);
  console.log(`Running smoke checks: EMPTY DATABASE MODE (mocked empty collections)`);
  console.log(`Targeting base URL: ${BASE_URL}`);
  console.log(`========================================`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });

  // Automatically inject authenticated admin token into localStorage
  await context.addInitScript(() => {
    localStorage.setItem("recruiteready_token", "mock-jwt-token-admin");
  });

  // Intercept all API requests with hermetic empty collection payloads
  await context.route("**/api/**", async (route) => {
    const url = new URL(route.request().url());
    const pathname = url.pathname;

    let matchedPayload = null;
    for (const [endpoint, payload] of Object.entries(MOCKED_EMPTY_ADMIN_RESPONSES)) {
      if (pathname === endpoint || pathname.startsWith(`${endpoint}/`)) {
        matchedPayload = payload;
        break;
      }
    }

    if (!matchedPayload) {
      matchedPayload = { success: true, data: {} };
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": "*",
        "access-control-allow-credentials": "true",
      },
      body: JSON.stringify(matchedPayload),
    });
  });

  const page = await context.newPage();

  const collectedErrors = [];
  page.on("pageerror", (err) => {
    collectedErrors.push({ type: "pageerror", text: err.message || String(err) });
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      const text = msg.text();
      if (!/Failed to load resource|net::ERR|favicon\.ico/.test(text)) {
        collectedErrors.push({ type: "console.error", text });
      }
    }
  });

  const results = [];

  for (const route of ADMIN_ROUTES) {
    const routeErrors = [];
    const startIndex = collectedErrors.length;

    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "domcontentloaded", timeout: 15000 });
      // Allow brief tick for React effects and subcomponents to mount
      await page.waitForTimeout(600);

      const hasCrashText = await page.evaluate(() => {
        return document.body.innerText.includes("This page hit a problem");
      });

      if (hasCrashText) {
        routeErrors.push("Error boundary triggered: 'This page hit a problem' detected on page");
      }

      const newErrors = collectedErrors.slice(startIndex);
      if (newErrors.length > 0) {
        for (const e of newErrors) {
          routeErrors.push(`[${e.type}] ${e.text}`);
        }
      }

      const pass = routeErrors.length === 0;
      results.push({ route, pass, errors: routeErrors });

      if (pass) {
        console.log(`  ✓ PASS (empty db): ${route}`);
      } else {
        console.error(`  ✗ FAIL (empty db): ${route}`);
        routeErrors.forEach((e) => console.error(`      - ${e}`));
      }
    } catch (err) {
      console.error(`  ✗ FAIL (empty db): ${route} (navigation error: ${err.message})`);
      results.push({ route, pass: false, errors: [err.message] });
    }
  }

  await context.close();
  return results;
}

async function main() {
  console.log(`Starting smoke test against: ${BASE_URL}`);
  let browser;
  let allPassed = true;

  try {
    browser = await chromium.launch({ headless: true });

    if (isEmptyDbMode) {
      const emptyDbResults = await verifyEmptyDatabaseAdminRoutes(browser);
      if (emptyDbResults.some((r) => !r.pass)) {
        allPassed = false;
      }
    } else {
      // 1. Student routes
      const studentResults = await verifyRoutes(browser, "Student", QA_EMAIL, QA_PASSWORD, STUDENT_ROUTES);
      if (studentResults.some((r) => !r.pass)) {
        allPassed = false;
      }

      // 2. Admin routes (if admin credentials provided)
      if (QA_ADMIN_EMAIL && QA_ADMIN_PASSWORD) {
        const adminResults = await verifyRoutes(browser, "Admin", QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD, ADMIN_ROUTES);
        if (adminResults.some((r) => !r.pass)) {
          allPassed = false;
        }
      } else {
        console.log("\nSkipping admin routes: QA_ADMIN_EMAIL / QA_ADMIN_PASSWORD not set.");
      }
    }

    console.log(`\n========================================`);
    if (allPassed) {
      console.log("SMOKE TEST STATUS: ALL ROUTES PASSED");
      process.exit(0);
    } else {
      console.error("SMOKE TEST STATUS: FAILED ROUTES DETECTED");
      process.exit(1);
    }
  } catch (err) {
    console.error("Smoke script execution failed:", err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

main();
