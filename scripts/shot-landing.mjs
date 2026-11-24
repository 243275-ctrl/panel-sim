import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
await p.goto("file:///home/user/panel-sim/docs/index.html", { waitUntil: "load" });
await p.waitForTimeout(400);
await p.screenshot({ path: "docs/assets/shot-landing.png" });
await b.close();
console.log("landing shot ok");
