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
const coffee = page.getByRole("link", { name: "Buy me a coffee" });
const coffeeHref = await coffee.getAttribute("href");
const coffeeTarget = await coffee.getAttribute("target");
console.log("coffee-link", coffeeHref, coffeeTarget);
if (coffeeHref !== "https://buymeacoffee.com/wilsonsamiano" || coffeeTarget !== "_blank") {
  console.log("FAIL coffee link missing or wrong");
  process.exitCode = 1;
}
await page.getByRole("button", { name: "Engage", exact: true }).click();
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

await page.evaluate(() => window.__controlsTest?.holdClear?.());
await page.waitForTimeout(480);
const clearingOn = await page.evaluate(() => window.__controlsTest?.getClearing?.() === true);
console.log("clearing", clearingOn);
if (!clearingOn) {
  console.log("FAIL expected slow wake-cleared pause");
  process.exitCode = 1;
}
await page.screenshot({ path: `${out}/cleared.png` });

await page.evaluate(() => window.__controlsTest?.skipWave?.());
await page.waitForTimeout(500);
const forgeText = await page.evaluate(() => document.body.innerText);
console.log("forge-text", forgeText.replace(/\s+/g, " ").slice(0, 320));
const forgeOk = /Coil Line/.test(forgeText) && /Engage · Wave 2/.test(forgeText) && /Wave 1 cleared/i.test(forgeText);
console.log("forge-has", forgeOk, /Coil Line/.test(forgeText), /Engage · Wave 2/.test(forgeText));
if (!forgeOk) {
  console.log("FAIL forge overlay missing next-wave briefing");
  process.exitCode = 1;
}
await page.screenshot({ path: `${out}/forge.png` });

const forgeFit = await page.evaluate(() => {
  const panel = document.querySelector("[data-forge-panel]");
  const map = document.querySelector("[data-forge-map]");
  if (!panel || !map) return { ok: false };
  return {
    ok:
      panel.scrollHeight <= panel.clientHeight + 2 &&
      map.scrollHeight <= map.clientHeight + 2 &&
      panel.scrollWidth <= panel.clientWidth + 2 &&
      map.scrollWidth <= map.clientWidth + 2,
    panel: { sh: panel.scrollHeight, ch: panel.clientHeight, sw: panel.scrollWidth, cw: panel.clientWidth },
    map: { sh: map.scrollHeight, ch: map.clientHeight, sw: map.scrollWidth, cw: map.clientWidth },
  };
});
console.log("forge-fit", forgeFit);
if (!forgeFit.ok) {
  console.log("FAIL forge tree still scrolls");
  process.exitCode = 1;
}

const buyBtn = page.getByRole("button", { name: /Forge · 1/ });
if (await buyBtn.count()) await buyBtn.click();
await page.getByRole("button", { name: /Engage · Wave 2/ }).click();
await page.waitForTimeout(400);

const afterForge = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX(), y: t.getY() } : null;
});
await page.evaluate(() => window.__controlsTest?.setKeys?.(["KeyA"]));
await page.waitForTimeout(350);
const afterForgeA = await page.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX() } : null;
});
await page.evaluate(() => window.__controlsTest?.setKeys?.([]));
const dxForgeA = (afterForgeA?.x ?? 0) - (afterForge?.x ?? 0);
console.log("post-forge dxA", dxForgeA);
if (!(dxForgeA < -8)) {
  console.log("FAIL A did not move left after forge");
  process.exitCode = 1;
}

for (let i = 0; i < 2; i++) {
  await page.evaluate(() => window.__controlsTest?.skipWave?.());
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Engage · Wave/ }).click();
  await page.waitForTimeout(350);
}
await page.screenshot({ path: `${out}/shards.png` });
const shardHud = await page.evaluate(() => document.body.innerText);
console.log("shard-wave", /Shard Bloom|W4/.test(shardHud), shardHud.replace(/\s+/g, " ").slice(0, 160));

for (let i = 0; i < 2; i++) {
  await page.evaluate(() => window.__controlsTest?.skipWave?.());
  await page.waitForTimeout(400);
  await page.getByRole("button", { name: /Engage · Wave/ }).click();
  await page.waitForTimeout(400);
}
await page.screenshot({ path: `${out}/rails.png` });
const railHud = await page.evaluate(() => document.body.innerText);
console.log("rail-wave", /Rail Net|W6/.test(railHud), railHud.replace(/\s+/g, " ").slice(0, 160));

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "networkidle" });
await mobile.getByRole("button", { name: "Engage", exact: true }).click();
await mobile.waitForTimeout(600);
await mobile.screenshot({ path: `${out}/gameplay-mobile.png` });

const wells = await mobile.locator("[data-touch-move]").count();
const aimWell = await mobile.locator("[data-touch-aim]").count();
console.log("touch-wells", wells, aimWell);
if (wells < 1 || aimWell < 1) {
  console.log("FAIL mobile touch wells missing");
  process.exitCode = 1;
}

async function dragStick(sel, dx, dy, hold = 420) {
  const box = await mobile.locator(sel).boundingBox();
  if (!box) throw new Error("missing " + sel);
  const x = box.x + box.width * 0.5;
  const y = box.y + box.height * 0.72;
  await mobile.evaluate(
    ({ selector, x, y, dx, dy }) => {
      const el = document.querySelector(selector);
      if (!el) throw new Error("missing " + selector);
      const fire = (type, cx, cy, buttons) => {
        el.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId: 21,
            pointerType: "touch",
            isPrimary: true,
            clientX: cx,
            clientY: cy,
            buttons,
            button: 0,
          }),
        );
      };
      fire("pointerdown", x, y, 1);
      fire("pointermove", x + dx, y + dy, 1);
    },
    { selector: sel, x, y, dx, dy },
  );
  await mobile.waitForTimeout(hold);
}

async function dropStick(sel) {
  await mobile.evaluate((selector) => {
    const el = document.querySelector(selector);
    el?.dispatchEvent(
      new PointerEvent("pointerup", {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 21,
        pointerType: "touch",
        isPrimary: true,
        buttons: 0,
      }),
    );
  }, sel);
}

const touchBefore = await mobile.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX(), yaw: t.getYaw?.() ?? 0 } : null;
});
await dragStick("[data-touch-move]", -52, 0);
const touchMoved = await mobile.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { x: t.getX() } : null;
});
await dropStick("[data-touch-move]");
const dxTouch = (touchMoved?.x ?? 0) - (touchBefore?.x ?? 0);
console.log("touch-move-dx", dxTouch);
if (!(dxTouch < -8)) {
  console.log("FAIL left touch stick did not strafe left");
  process.exitCode = 1;
}

await dragStick("[data-touch-aim]", 64, 0, 500);
const touchAimed = await mobile.evaluate(() => {
  const t = window.__controlsTest;
  return t ? { yaw: t.getYaw?.() ?? 0, want: t.getWant?.() ?? 0 } : null;
});
await dropStick("[data-touch-aim]");
console.log("touch-aim", touchAimed);
if (Math.abs(touchAimed?.want ?? -1.57) > 0.55) {
  console.log("FAIL right touch stick did not aim");
  process.exitCode = 1;
}
await mobile.screenshot({ path: `${out}/touch-sticks.png` });

await mobile.evaluate(() => window.__controlsTest?.skipWave?.());
await mobile.waitForTimeout(500);
await mobile.screenshot({ path: `${out}/forge-mobile.png` });
const mobForge = await mobile.evaluate(() => document.body.innerText);
console.log("forge-mobile", /Coil Line/.test(mobForge), /Engage · Wave 2/.test(mobForge));
if (!/Engage · Wave 2/.test(mobForge)) {
  console.log("FAIL mobile forge overlay");
  process.exitCode = 1;
}
const hasChips = /HULL/.test(mobForge) && /COIL/.test(mobForge);
console.log("forge-chips", hasChips);
if (!hasChips) {
  console.log("FAIL mobile forge skill chips missing");
  process.exitCode = 1;
}
const hullChip = mobile.getByRole("button", { name: /HULL/ });
if (await hullChip.count()) await hullChip.first().click();
const mobFit = await mobile.evaluate(() => {
  const panel = document.querySelector("[data-forge-panel]");
  const map = document.querySelector("[data-forge-map]");
  if (!panel || !map) return { ok: false };
  return {
    ok:
      panel.scrollHeight <= panel.clientHeight + 2 &&
      map.scrollHeight <= map.clientHeight + 2 &&
      panel.scrollWidth <= panel.clientWidth + 2,
    panel: { sh: panel.scrollHeight, ch: panel.clientHeight, sw: panel.scrollWidth, cw: panel.clientWidth },
    map: { sh: map.scrollHeight, ch: map.clientHeight },
  };
});
console.log("forge-mobile-fit", mobFit);
if (!mobFit.ok) {
  console.log("FAIL mobile forge tree still scrolls");
  process.exitCode = 1;
}

console.log("errors", errors);
if (errors.length) process.exitCode = 1;
await browser.close();
console.log("QA done", process.exitCode || 0);
