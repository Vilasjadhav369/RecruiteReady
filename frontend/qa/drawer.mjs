import { chromium } from "playwright"; import { spawn } from "node:child_process";
const srv = spawn("npx",["vite","preview","--port","4181","--strictPort"],{stdio:"ignore"}); await new Promise(r=>setTimeout(r,3000));
const b=await chromium.launch(); const ctx=await b.newContext({viewport:{width:390,height:844}}); await ctx.addInitScript(()=>localStorage.setItem("recruiteready_token","t"));
const p=await ctx.newPage(); const user={_id:"u1",firstName:"A",role:"student",onboardingCompleted:true};
await p.route("**/api/**",r=>{const u=new URL(r.request().url()).pathname.replace(/^\/api/,"");r.fulfill({status:200,contentType:"application/json",body:JSON.stringify({success:true,data:u==="/auth/me"?{user}:{}})})});
await p.goto("http://localhost:4181/dashboard"); await p.waitForTimeout(1200);
await p.click('button[aria-label="Open navigation menu"]'); await p.waitForTimeout(400);
await p.locator('[aria-label="Student navigation menu"] >> text=Mock Tests').first().click(); await p.waitForURL("**/mock-tests",{timeout:4000}).then(()=>console.log("PASS drawer opens and navigates on mobile")).catch(()=>console.log("FAIL drawer"));
await b.close(); srv.kill();
