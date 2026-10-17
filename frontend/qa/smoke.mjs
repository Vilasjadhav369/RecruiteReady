// Browser smoke test against the PRODUCTION build with a mocked API (backend is not in this repo).
import { chromium } from "playwright";
import { spawn } from "node:child_process";
import fs from "node:fs";

const PORT = 4173, BASE = `http://localhost:${PORT}`;
const srv = spawn("npx", ["vite", "preview", "--port", String(PORT), "--strictPort"], { stdio: "ignore" });
await new Promise((r) => setTimeout(r, 3500));

const user = { _id: "u1", firstName: "Asha", lastName: "Rao", email: "asha@test.dev", role: "student", college: "Test College", branch: "CSE", graduationYear: 2027, onboardingCompleted: true };
const problem = { _id: "p1", title: "Two Sum", difficulty: "easy", description: "Find two numbers.", topics: ["Array"], constraints: ["n <= 10^4"],
  starterCode: { javascript: "function twoSum(nums, target) {\n  // your code\n  const seen = new Map();\n  return [];\n}\n", python: "def two_sum(nums, target):\n    return []\n", java: "class Solution {}", cpp: "int main(){}" },
  testCases: [{ input: "[2,7]", expectedOutput: "[0,1]", isHidden: false }] };
const ok = (data) => ({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data }) });

async function mock(page, authed) {
  await page.route("**/api/**", (route) => {
    const u = new URL(route.request().url()); const p = u.pathname.replace(/^\/api/, "");
    if (!authed && p === "/auth/me") return route.fulfill({ status: 401, contentType: "application/json", body: "{}" });
    if (p === "/auth/me") return route.fulfill(ok({ user }));
    if (p === "/dashboard/summary") return route.fulfill(ok({ profile: user, streakDays: 0, preparation: { aptitude: { attempted: 3, completed: 2 }, coding: { attempted: 4, solved: 3 }, mockTests: { attempted: 1, completed: 1 } }, targetCompanies: [], recentActivity: [], upcomingTests: [], weakAreas: [], readiness: {}, profileCompletion: { percentage: 80, missing: [] }, preparationGoals: [] }));
    if (p === "/notifications/unread-count") return route.fulfill(ok({ unreadCount: 2 }));
    if (p === "/notifications") return route.fulfill(ok({ notifications: [], pagination: {} }));
    if (p === "/coding/problems/p1") return route.fulfill(ok({ problem }));
    if (p === "/companies") return route.fulfill(ok({ companies: [], pagination: { total: 0, page: 1, pages: 1 } }));
    if (p === "/bookmarks/status/coding/p1") return route.fulfill(ok({ bookmarked: false }));
    if (p === "/mock-tests/history") return route.fulfill(ok({ attempts: [{ _id: "m1", status: "in_progress", mockTest: { title: "Full Mock 1" }, startedAt: new Date().toISOString(), totalQuestions: 3 }, { _id: "m2", status: "submitted", mockTest: { title: "=cmd|calc" }, score: 5, totalQuestions: 10, percentage: 50, submittedAt: new Date().toISOString() }], pagination: { total: 2, page: 1, limit: 10, pages: 1 } }));
    if (p === "/aptitude/history") return route.fulfill(ok({ attempts: [], pagination: { total: 0, page: 1, limit: 10, pages: 1 } }));
    if (p === "/mock-tests/attempts/m1") return route.fulfill(ok({ attempt: { _id: "m1", status: "in_progress", remainingSeconds: 50, answers: [] }, test: { title: "Full Mock 1" }, questions: [
      { _id: "q1", question: "Q one?", category: "Quant", options: [{ key: "A", text: "a1" }, { key: "B", text: "b1" }, { key: "C", text: "c1" }, { key: "D", text: "d1" }] },
      { _id: "q2", question: "Q two?", category: "Quant", options: [{ key: "A", text: "a2" }, { key: "B", text: "b2" }] }] }));
    if (p === "/search") return route.fulfill(ok({ query: "x", totalResults: 0, companies: [], resources: [], coding: [], mockTests: [], aptitude: [] }));
    return route.fulfill(ok({}));
  });
}

const results = []; const log = (name, pass, note = "") => { results.push({ name, pass, note }); console.log(pass ? "PASS" : "FAIL", name, note); };
const browser = await chromium.launch();
fs.mkdirSync("qa/shots", { recursive: true });

try {
  // 1. Public landing, light, then toggle dark, reload keeps dark, no flash
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, colorScheme: "light" });
  const page = await ctx.newPage(); const errors = [];
  page.on("pageerror", (e) => errors.push(e.message)); page.on("console", (m) => m.type() === "error" && !/Failed to load resource|net::ERR/.test(m.text()) && errors.push(m.text()));
  await mock(page, false);
  await page.goto(BASE + "/"); await page.waitForSelector("h1");
  log("landing renders light", (await page.getAttribute("html", "data-theme")) === "light");
  await page.screenshot({ path: "qa/shots/landing-light.png" });
  await page.click('button[aria-label^="Appearance settings"]'); await page.click('[role="radio"]:has-text("Dark")');
  await page.waitForTimeout(1100);
  log("toggle -> dark", (await page.getAttribute("html", "data-theme")) === "dark");
  const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  log("dark body background is dark", bg === "rgb(11, 16, 32)", bg);
  await page.screenshot({ path: "qa/shots/landing-dark.png" });
  // scroll to trigger reveals and capture
  await page.evaluate(() => window.scrollTo(0, 1100)); await page.waitForTimeout(900);
  await page.screenshot({ path: "qa/shots/landing-dark-scrolled.png" });
  // persistence + first paint (read attribute at DOMContentLoaded via init script)
  await page.reload({ waitUntil: "domcontentloaded" });
  log("dark persists after reload", (await page.getAttribute("html", "data-theme")) === "dark");
  log("localStorage rr_theme=dark", (await page.evaluate(() => localStorage.getItem("rr_theme"))) === "dark");
  log("hero h1 typing region has sr-only full text", (await page.locator(".sr-only", { hasText: "Aptitude practice that tracks" }).count()) > 0);
  // login page dark
  await page.goto(BASE + "/login"); await page.waitForSelector("form, input");
  await page.screenshot({ path: "qa/shots/login-dark.png" });
  log("no runtime JS errors (public)", errors.length === 0, errors.slice(0, 3).join(" | "));
  await ctx.close();

  // 2. System preference dark with no stored choice
  const ctx2 = await browser.newContext({ colorScheme: "dark" }); const p2 = await ctx2.newPage(); await mock(p2, false);
  await p2.goto(BASE + "/"); await p2.waitForSelector("h1");
  log("system dark respected without stored pref", (await p2.getAttribute("html", "data-theme")) === "dark");
  await ctx2.close();

  // 3. Authenticated flows
  const ctx3 = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx3.addInitScript(() => localStorage.setItem("recruiteready_token", "test-token"));
  const p3 = await ctx3.newPage(); const errs3 = [];
  p3.on("pageerror", (e) => errs3.push(e.message));
  await mock(p3, true);
  await p3.goto(BASE + "/dashboard"); await p3.waitForSelector("text=Preparation Modules", { timeout: 8000 });
  await p3.waitForTimeout(1200);
  await p3.screenshot({ path: "qa/shots/dashboard-light.png" });
  log("dashboard renders + Recently viewed card", (await p3.locator("text=Recently viewed").count()) > 0);
  // command palette
  await p3.keyboard.press("Control+k"); await p3.waitForSelector('[aria-label="Command palette and search"]');
  await p3.screenshot({ path: "qa/shots/palette-light.png" });
  await p3.keyboard.type("coding"); await p3.waitForTimeout(500);
  await p3.keyboard.press("Enter"); await p3.waitForURL("**/coding", { timeout: 5000 }).then(() => log("palette: type 'coding' + Enter navigates to /coding", true)).catch(() => log("palette navigation", false, p3.url()));
  // theme from palette
  await p3.keyboard.press("Control+k"); await p3.waitForTimeout(300); await p3.keyboard.type("dark theme"); await p3.waitForTimeout(400); await p3.keyboard.press("Enter");
  await p3.waitForTimeout(500); log("palette toggles theme", (await p3.getAttribute("html", "data-theme")) === "dark");
  // recently viewed + coding editor
  await p3.goto(BASE + "/coding/problem/p1"); await p3.waitForSelector("#code-editor-textarea", { timeout: 8000 });
  await p3.waitForTimeout(500);
  await p3.screenshot({ path: "qa/shots/coding-dark.png" });
  log("highlighted tokens rendered", (await p3.locator(".tok-keyword").count()) > 0 && (await p3.locator(".tok-comment").count()) > 0);
  const ta = p3.locator("#code-editor-textarea"); await ta.click(); await p3.keyboard.press("Control+End");
  await p3.keyboard.type("\nif (x) {"); await p3.keyboard.press("Enter"); await p3.keyboard.type("y();");
  const v = await ta.inputValue(); log("auto-indent after '{'", /if \(x\) \{\n  y\(\);$/.test(v), JSON.stringify(v.slice(-18)));
  await p3.keyboard.press("Tab"); log("Tab indents (trap on)", (await ta.inputValue()).endsWith("  "));
  await p3.keyboard.press("Escape"); await p3.keyboard.press("Tab");
  log("Escape releases focus trap (Tab leaves editor)", await p3.evaluate(() => document.activeElement?.id !== "code-editor-textarea"));
  await p3.goto(BASE + "/dashboard"); await p3.waitForSelector("text=Two Sum", { timeout: 8000 }).then(() => log("recently viewed lists the opened problem", true)).catch(() => log("recently viewed lists the opened problem", false));
  await p3.screenshot({ path: "qa/shots/dashboard-dark.png" });
  log("no runtime JS errors (authed)", errs3.length === 0, errs3.slice(0, 3).join(" | "));
  await ctx3.close();

  // 4. Mobile 390 + reduced motion
  const ctx4 = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: "reduce", colorScheme: "dark" });
  await ctx4.addInitScript(() => localStorage.setItem("recruiteready_token", "test-token"));
  const p4 = await ctx4.newPage(); await mock(p4, true);
  await p4.goto(BASE + "/dashboard"); await p4.waitForSelector("text=Preparation Modules", { timeout: 8000 }); await p4.waitForTimeout(500);
  const overflow = await p4.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log("mobile 390: no horizontal overflow (dashboard)", overflow <= 1, `overflow=${overflow}`);
  await p4.screenshot({ path: "qa/shots/dashboard-mobile-dark.png" });
  await p4.goto(BASE + "/coding/problem/p1"); await p4.waitForSelector("text=Two Sum"); await p4.locator("button", { hasText: /^\s*(Code|Editor|Code Editor)\s*$/ }).first().click(); await p4.waitForSelector("#code-editor-textarea", { state: "visible" }); await p4.waitForTimeout(400);
  const o2 = await p4.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  log("mobile 390: no horizontal overflow (coding)", o2 <= 1, `overflow=${o2}`);
  await p4.screenshot({ path: "qa/shots/coding-mobile-dark.png" });
  await p4.goto(BASE + "/"); await p4.waitForSelector("h1"); await p4.waitForTimeout(300);
  const caret = await p4.locator(".rr-caret").count();
  log("reduced motion: typing caret/animation disabled", caret === 0, `carets=${caret}`);
  const hidden = await p4.evaluate(() => [...document.querySelectorAll(".rr-reveal")].filter((e) => getComputedStyle(e).opacity === "0").length);
  log("reduced motion: reveal sections visible", hidden === 0, `hidden=${hidden}`);
  await ctx4.close();

  // 5. Round-3 features
  const ctx5 = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true });
  await ctx5.addInitScript(() => localStorage.setItem("recruiteready_token", "test-token"));
  const p5 = await ctx5.newPage(); const errs5 = [];
  p5.on("pageerror", (e) => errs5.push(e.message));
  await mock(p5, true);
  await p5.goto(BASE + "/dashboard"); await p5.waitForSelector("text=Preparation Modules", { timeout: 8000 });
  // first-run tour
  await p5.waitForSelector('[aria-labelledby="tour-title"]', { timeout: 4000 }).then(() => log("welcome tour appears on first visit", true)).catch(() => log("welcome tour appears on first visit", false));
  await p5.click('text=Next'); await p5.click('text=Next'); await p5.click('text=Got it');
  log("tour dismissed + remembered", (await p5.locator('[aria-labelledby="tour-title"]').count()) === 0 && (await p5.evaluate(() => !!localStorage.getItem("rr_tour_done_u1"))));
  // continue card from real in_progress history
  log("continue card lists in-progress mock", (await p5.locator("text=Continue where you left off").count()) > 0 && (await p5.locator("text=Full Mock 1").count()) > 0);
  // shortcut help
  await p5.keyboard.press("Shift+Slash"); await p5.waitForSelector('[aria-label="Keyboard shortcuts"]', { timeout: 3000 }).then(() => log("'?' opens shortcut help", true)).catch(() => log("'?' opens shortcut help", false));
  await p5.keyboard.press("Escape");
  // Warm Paper
  await p5.click('button[aria-label^="Appearance settings"]'); await p5.click('[role="radio"]:has-text("Warm Paper")'); await p5.waitForTimeout(800);
  log("Warm Paper applied", (await p5.getAttribute("html", "data-theme")) === "paper");
  const pbg = await p5.evaluate(() => getComputedStyle(document.body).backgroundColor);
  log("paper background is cream", pbg === "rgb(246, 240, 228)", pbg);
  const ff = await p5.evaluate(() => getComputedStyle(document.querySelector("h1,h2,h3")).fontFamily);
  log("paper headings use serif", /Serif|Georgia/i.test(ff), ff.slice(0, 40));
  await p5.screenshot({ path: "qa/shots/dashboard-paper.png" });
  // accent + text size
  await p5.keyboard.press("Escape");
  await p5.click('button[aria-label^="Appearance settings"]').catch(() => {});
  if (!(await p5.locator('[aria-label="Accent colour"]').isVisible())) await p5.click('button[aria-label^="Appearance settings"]');
  await p5.click('[role="radio"][aria-label="Violet"]'); await p5.waitForTimeout(300);
  log("accent violet applied", (await p5.getAttribute("html", "data-accent")) === "violet");
  await p5.click('[role="radio"][aria-label="Larger"]');
  log("text size large applied", (await p5.getAttribute("html", "data-text")) === "lg");
  await p5.screenshot({ path: "qa/shots/dashboard-paper-violet.png" });
  await p5.reload({ waitUntil: "domcontentloaded" });
  log("theme + accent + text size persist across reload", (await p5.getAttribute("html", "data-theme")) === "paper" && (await p5.getAttribute("html", "data-accent")) === "violet" && (await p5.getAttribute("html", "data-text")) === "lg");
  // CSV export on history (formula injection neutralised)
  await p5.goto(BASE + "/mock-tests/history"); await p5.waitForSelector("text=Export CSV", { timeout: 8000 });
  const [dl] = await Promise.all([p5.waitForEvent("download"), p5.click("text=Export CSV")]);
  const csv = fs.readFileSync(await dl.path(), "utf8");
  log("CSV export downloads with header + rows", csv.includes("Test,Date,Status") && csv.includes("Full Mock 1"));
  log("CSV neutralises formula injection", csv.includes("'=cmd|calc") && !/(^|,)=cmd/m.test(csv));
  // Mock session: shortcuts, slide transition class, timer pulse
  await p5.goto(BASE + "/mock-tests/session/m1"); await p5.waitForSelector("text=Q one?", { timeout: 8000 });
  await p5.keyboard.press("b"); await p5.waitForTimeout(200);
  log("mock shortcut 'B' selects option B", (await p5.locator('[role="radio"][aria-checked="true"]').innerText()).includes("b1"));
  await p5.keyboard.press("ArrowRight"); await p5.waitForSelector("text=Q two?");
  log("mock shortcut → moves to next question", true);
  log("question slide animation class present", (await p5.locator(".rr-q-next").count()) > 0);
  log("timer pulses in final minute (50s left)", (await p5.locator(".rr-timer-pulse").count()) > 0);
  await p5.keyboard.press("m"); await p5.waitForTimeout(150);
  log("mock shortcut 'M' marks question for review", (await p5.locator("text=Marked for Review").count()) > 0);
  await p5.keyboard.press("m"); await p5.waitForTimeout(150);
  log("mock shortcut 'M' again unmarks", (await p5.locator("text=Marked for Review").count()) === 0);
  log("no runtime JS errors (round-3 flows)", errs5.length === 0, errs5.slice(0, 3).join(" | "));
  await ctx5.close();
} catch (e) { log("UNEXPECTED ERROR", false, e.message); }
await browser.close(); srv.kill();
fs.writeFileSync("qa/results.json", JSON.stringify(results, null, 2));
console.log(`\n${results.filter((r) => r.pass).length}/${results.length} checks passed`);
