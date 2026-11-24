import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("docs/assets", { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
});
await page.goto("http://localhost:5173", { waitUntil: "networkidle" });
await page.waitForTimeout(600);
await page.screenshot({ path: "docs/assets/shot-start.png" });

await page.click('button:has-text("PLC demo")');
await page.waitForTimeout(400);
await page.click('button:has-text("▶ Run")');
await page.waitForTimeout(1000);
await page.screenshot({ path: "docs/assets/shot-demo.png" });

await page.click('button:has-text("▤ Program")');
await page.waitForTimeout(500);
await page.screenshot({ path: "docs/assets/shot-ladder.png" });

await browser.close();
console.log("shots done");
