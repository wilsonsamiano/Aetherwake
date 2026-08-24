import { chromium } from "playwright";
import fs from "node:fs";

const out = "/workspace/screenshots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(e.message));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "Engage" }).click();
await page.waitForTimeout(500);
const hud1 = await page.evaluate(() => document.body.innerText);
console.log("hud-prefix", hud1.slice(0, 180).replace(/\s+/g, " "));
await page.screenshot({ path: `${out}/gameplay.png` });

const before = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX(), y: t.getY(), speed: t.getSpeed() } : null;
});
console.log("before", before);

await page.evaluate(() => window.__controlsTest?.setKeys?.(["KeyA"]));
await page.waitForTimeout(400);
const afterA = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX(), y: t.getY(), speed: t.getSpeed() } : null;
});
console.log("afterA", afterA);

await page.evaluate(() => window.__controlsTest?.setKeys?.([]));
await page.waitForTimeout(50);
await page.evaluate(() => window.__controlsTest?.setKeys?.(["KeyD"]));
await page.waitForTimeout(400);
const afterD = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX(), y: t.getY(), speed: t.getSpeed() } : null;
});
console.log("afterD", afterD);
await page.evaluate(() => window.__controlsTest?.setKeys?.([]));

const dxA = (afterA?.x ?? 0) - (before?.x ?? 0);
const dxD = (afterD?.x ?? 0) - (afterA?.x ?? 0);
console.log("dxA", dxA, "dxD", dxD);
if (!(dxA < -8)) {
  console.log("FAIL A did not move left");
  process.exitCode = 1;
}
if (!(dxD > 8)) {
  console.log("FAIL D did not move right");
  process.exitCode = 1;
}

await page.screenshot({ path: `${out}/gameplay-moved.png` });

await page.getByRole("button", { name: "Pause" }).click();
await page.waitForTimeout(250);
await page.screenshot({ path: `${out}/pause.png` });
const pauseText = await page.evaluate(() => document.body.innerText);
console.log("pause-has", /Paused/.test(pauseText), pauseText.slice(0, 120).replace(/\s+/g, " "));

await page.getByRole("button", { name: /Forge map/ }).click();
await page.waitForTimeout(250);
await page.screenshot({ path: `${out}/skills.png` });
const skillText = await page.evaluate(() => document.body.innerText);
console.log("skills-has", /Forge map/.test(skillText), /Wake Core/.test(skillText));

await page.getByRole("button", { name: "Close forge map" }).click();
await page.waitForTimeout(200);
if (await page.getByRole("button", { name: "Resume" }).count()) {
  await page.getByRole("button", { name: "Resume" }).click();
}
await page.waitForTimeout(300);
await page.screenshot({ path: `${out}/gameplay-resume.png` });

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await mobile.getByRole("button", { name: "Engage" }).click();
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: `${out}/gameplay-mobile.png` });

console.log("errors", errors);
await browser.close();
console.log("QA done", process.exitCode || 0);
