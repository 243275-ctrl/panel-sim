import { chromium } from "playwright";
const out = process.argv[2] || "replica/design/art-sheet-after.png";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1240, height: 900 }, deviceScaleFactor: 1.5 });
await p.goto("http://localhost:5173/art-sheet.html", { waitUntil: "networkidle" });
await p.waitForTimeout(700);
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log("sheet:", out);
