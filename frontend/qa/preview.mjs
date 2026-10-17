import { chromium } from "playwright";
import { spawn } from "node:child_process";
const PORT=4190, BASE=`http://localhost:${PORT}`;
const srv=spawn("npx",["vite","preview","--port",String(PORT),"--strictPort"],{stdio:"ignore"});
await new Promise(r=>setTimeout(r,3500));
const user={_id:"u1",firstName:"Asha",lastName:"Rao",email:"asha@test.dev",role:"student",college:"Test College",branch:"CSE",graduationYear:2027,onboardingCompleted:true};
const problem={_id:"p1",title:"Two Sum",difficulty:"easy",description:"Given an array of integers and a target, return the indices of the two numbers that add up to the target.",topics:["Array","Hash Map"],constraints:["2 <= n <= 10^4","Exactly one valid answer exists"],
 starterCode:{javascript:"function twoSum(nums, target) {\n  // your code\n  const seen = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const need = target - nums[i];\n    if (seen.has(need)) return [seen.get(need), i];\n    seen.set(nums[i], i);\n  }\n  return [];\n}\n"},testCases:[{input:"[2,7,11,15], 9",expectedOutput:"[0,1]",isHidden:false}]};
const ok=d=>({status:200,contentType:"application/json",body:JSON.stringify({success:true,data:d})});
async function mock(page){await page.route("**/api/**",r=>{const p=new URL(r.request().url()).pathname.replace(/^\/api/,"");
 if(p==="/auth/me")return r.fulfill(ok({user}));
 if(p==="/dashboard/summary")return r.fulfill(ok({profile:user,streakDays:6,preparation:{aptitude:{attempted:14,completed:12},coding:{attempted:22,solved:17},mockTests:{attempted:4,completed:3}},targetCompanies:[],recentActivity:[],upcomingTests:[],weakAreas:[],readiness:{},profileCompletion:{percentage:72,missing:[]},preparationGoals:[]}));
 if(p==="/notifications/unread-count")return r.fulfill(ok({unreadCount:2}));
 if(p==="/coding/problems/p1")return r.fulfill(ok({problem}));
 if(p==="/mock-tests/history")return r.fulfill(ok({attempts:[{_id:"m1",status:"in_progress",mockTest:{title:"Full Placement Mock 1"},startedAt:new Date().toISOString(),totalQuestions:30},{_id:"m2",status:"submitted",mockTest:{title:"Quant & Logical Sprint"},score:24,totalQuestions:30,percentage:80,submittedAt:new Date().toISOString()},{_id:"m3",status:"submitted",mockTest:{title:"Verbal Ability Test"},score:14,totalQuestions:25,percentage:56,submittedAt:new Date(Date.now()-864e5*3).toISOString()}],pagination:{total:3,page:1,limit:10,pages:1}}));
 if(p==="/aptitude/history")return r.fulfill(ok({attempts:[],pagination:{total:0,page:1,limit:10,pages:1}}));
 if(p==="/mock-tests/attempts/m1")return r.fulfill(ok({attempt:{_id:"m1",status:"in_progress",remainingSeconds:1740,answers:[]},test:{title:"Full Placement Mock 1"},questions:[{_id:"q1",question:"A train 150 m long passes a pole in 15 seconds. What is its speed in km/h?",category:"Quantitative",topic:"Time & Distance",marks:1,options:[{key:"A",text:"30 km/h"},{key:"B",text:"36 km/h"},{key:"C",text:"40 km/h"},{key:"D",text:"45 km/h"}]},{_id:"q2",question:"Q2",category:"Logical",options:[{key:"A",text:"x"},{key:"B",text:"y"}]}]}));
 if(p==="/companies")return r.fulfill(ok({companies:[],pagination:{total:0,page:1,pages:1}}));
 if(p.startsWith("/bookmarks"))return r.fulfill(ok({bookmarked:false}));
 if(p==="/search")return r.fulfill(ok({query:"",totalResults:0,companies:[],resources:[],coding:[],mockTests:[],aptitude:[]}));
 return r.fulfill(ok({}));});}
const b=await chromium.launch();
async function shot(name,{theme="light",accent,path,w=1440,h=900,authed=true,action,full=false,wait=1400}){
 const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:1});
 await ctx.addInitScript(([t,a,au])=>{localStorage.setItem("rr_theme",t);if(a)localStorage.setItem("rr_accent",a);localStorage.setItem("rr_tour_done_u1","1");if(au)localStorage.setItem("recruiteready_token","t");},[theme,accent,authed]);
 const p=await ctx.newPage(); await mock(p);
 await p.goto(BASE+path); await p.waitForTimeout(wait);
 if(action) await action(p);
 await p.screenshot({path:`qa/preview/${name}.png`,fullPage:full}); await ctx.close(); console.log("ok",name);
}
for(const t of ["light","dark","paper"]){
 await shot(`01-landing-${t}`,{theme:t,path:"/",authed:false,wait:2600});
 await shot(`02-dashboard-${t}`,{theme:t,path:"/dashboard"});
}
await shot("03-coding-light",{theme:"light",path:"/coding/problem/p1"});
await shot("04-coding-paper",{theme:"paper",path:"/coding/problem/p1"});
await shot("05-mock-session-light",{theme:"light",path:"/mock-tests/session/m1"});
await shot("06-mock-session-dark",{theme:"dark",path:"/mock-tests/session/m1"});
await shot("07-mock-history-paper",{theme:"paper",path:"/mock-tests/history"});
await shot("08-command-palette-dark",{theme:"dark",path:"/dashboard",action:async p=>{await p.keyboard.press("Control+k");await p.waitForTimeout(700);}});
await shot("09-appearance-menu-light",{theme:"light",path:"/dashboard",action:async p=>{await p.click('button[aria-label^="Appearance settings"]');await p.waitForTimeout(400);}});
await shot("10-dashboard-violet-dark",{theme:"dark",accent:"violet",path:"/dashboard"});
await shot("11-login-light",{theme:"light",path:"/login",authed:false});
await shot("12-mobile-dashboard-paper",{theme:"paper",path:"/dashboard",w:390,h:844});
await shot("13-mobile-landing-light",{theme:"light",path:"/",w:390,h:844,authed:false,wait:2400});
await shot("14-shortcuts-dialog-light",{theme:"light",path:"/dashboard",action:async p=>{await p.keyboard.press("Shift+Slash");await p.waitForTimeout(500);}});
await b.close(); srv.kill();
