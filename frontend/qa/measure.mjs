// Measures document height (scroll length) of key pages at 1440x900 with the mocked API.
import { chromium } from "playwright"; import { spawn } from "node:child_process"; import fs from "node:fs";
const label = process.argv[2] || "run";
const srv = spawn("npx", ["vite", "preview", "--port", "4210", "--strictPort"], { stdio: "ignore" }); await new Promise(r => setTimeout(r, 3500));
const user = { _id: "u1", firstName: "Asha", lastName: "Rao", email: "a@t.dev", role: "student", college: "Test College", branch: "CSE", graduationYear: 2027, onboardingCompleted: true };
const ok = d => ({ status: 200, contentType: "application/json", body: JSON.stringify({ success: true, data: d }) });
const rows = n => Array.from({ length: n }, (_, i) => ({ _id: "x" + i, name: "Company " + i, title: "Item " + i, status: "submitted", mockTest: { title: "Mock " + i }, score: 10, totalQuestions: 20, percentage: 50, submittedAt: new Date().toISOString(), firstName: "S" + i, lastName: "T", email: "s" + i + "@t.dev", role: "student", difficulty: "easy", category: "Quant" }));
const b = await chromium.launch(); const out = {};
const pages = [["student dashboard", "/dashboard", false], ["progress", "/progress", false], ["mock history", "/mock-tests/history", false], ["admin dashboard", "/admin", true], ["admin students", "/admin/students", true], ["admin companies", "/admin/companies", true]];
for (const [name, path, admin] of pages) {
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { localStorage.setItem("recruiteready_token", "t"); localStorage.setItem("rr_tour_done_u1", "1"); });
  const p = await ctx.newPage();
  await p.route("**/api/**", r => { const u = new URL(r.request().url()).pathname.replace(/^\/api/, "");
    if (u === "/auth/me") return r.fulfill(ok({ user: { ...user, role: admin ? "admin" : "student" } }));
    if (u === "/dashboard/summary") return r.fulfill(ok({ profile: user, streakDays: 6, preparation: { aptitude: { attempted: 14, completed: 12 }, coding: { attempted: 22, solved: 17 }, mockTests: { attempted: 4, completed: 3 } }, targetCompanies: [], recentActivity: rows(5).map(x => ({ ...x, type: "mock", label: x.title })), upcomingTests: [], weakAreas: [], readiness: {}, profileCompletion: { percentage: 72, missing: [] }, preparationGoals: [] }));
    if (u === "/mock-tests/history") return r.fulfill(ok({ attempts: rows(10), pagination: { total: 10, page: 1, limit: 10, pages: 1 } }));
    if (u.startsWith("/admin/students")) return r.fulfill(ok({ students: rows(10), users: rows(10), pagination: { total: 10, page: 1, limit: 10, pages: 1 } }));
    if (u.startsWith("/admin/companies") || u === "/companies") return r.fulfill(ok({ companies: rows(10), pagination: { total: 10, page: 1, limit: 10, pages: 1 } }));
    return r.fulfill(ok({})); });
  await p.goto("http://localhost:4210" + path); await p.waitForTimeout(2200);
  out[name] = await p.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight, ...[...document.querySelectorAll("main")].map(m => m.scrollHeight + 60)));
  await ctx.close();
}
await b.close(); srv.kill(); fs.writeFileSync(`qa/height-${label}.json`, JSON.stringify(out, null, 2)); console.log(label, out);
