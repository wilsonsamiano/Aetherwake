import { chromium } from "playwright";
import fs from "node:fs";

const out = "/workspace/screenshots";
fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({ args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on("console", (m) => {
  if (m.type() === "error") errors.push(m.text());
});
page.on("pageerror", (e) => errors.push(e.message));

await page.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(500);
await page.getByRole("button", { name: "Engage" }).click();
await page.waitForTimeout(400);

const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

function probe() {
  return page.evaluate(() => {
    const t = window.__controlsTest;
    return t
      ? {
          x: t.getX(),
          y: t.getY(),
          yaw: t.getYaw(),
          want: t.getWant?.() ?? t.getYaw(),
          omega: t.getOmega?.() ?? 0,
          speed: t.getSpeed(),
        }
      : null;
  });
}

// --- A left / D right (top-down strafe, not yaw) ---
const before = await probe();
await page.evaluate(() => window.__controlsTest?.setKeys?.(["KeyA"]));
await page.waitForTimeout(450);
const afterA = await probe();
await page.evaluate(() => window.__controlsTest?.setKeys?.([]));
await page.waitForTimeout(40);
await page.evaluate(() => window.__controlsTest?.setKeys?.(["KeyD"]));
await page.waitForTimeout(450);
const afterD = await probe();
await page.evaluate(() => window.__controlsTest?.setKeys?.([]));
const dxA = (afterA?.x ?? 0) - (before?.x ?? 0);
const dxD = (afterD?.x ?? 0) - (afterA?.x ?? 0);
console.log("strafe", { before, afterA, afterD, dxA, dxD });
if (!(dxA < -12)) {
  console.log("FAIL A did not move left");
  process.exitCode = 1;
}
if (!(dxD > 12)) {
  console.log("FAIL D did not move right");
  process.exitCode = 1;
}

const canvas = page.locator("canvas");
const box = await canvas.boundingBox();
if (!box) throw new Error("no canvas");

// --- Rotation physics: hull lags the reticle on a hard flick ---
const rest = await probe();
const flickX = box.x + box.width * 0.92;
const flickY = box.y + box.height * 0.5;
await page.mouse.move(flickX, flickY);
await page.waitForTimeout(50);
const midTurn = await probe();
await page.screenshot({ path: `${out}/yaw-midturn.png` });
await page.waitForTimeout(420);
const settled = await probe();
const errMid = Math.abs(wrap((midTurn?.want ?? 0) - (midTurn?.yaw ?? 0)));
const errSet = Math.abs(wrap((settled?.want ?? 0) - (settled?.yaw ?? 0)));
const turnedToward = Math.abs(wrap((midTurn?.yaw ?? 0) - (rest?.yaw ?? 0))) > 0.08;
console.log("yaw-physics", { rest, midTurn, settled, errMid, errSet, turnedToward });
if (!turnedToward) {
  console.log("FAIL hull did not start turning toward the flick");
  process.exitCode = 1;
}
if (!(errMid > 0.12)) {
  console.log("FAIL hull snapped instantly — no rotation mass");
  process.exitCode = 1;
}
if (!(errSet < 0.12)) {
  console.log("FAIL hull did not settle onto the reticle");
  process.exitCode = 1;
}

// --- Mouse aim independent of movement ---
const aimX = box.x + box.width * 0.78;
const aimY = box.y + box.height * 0.22;
await page.mouse.move(aimX, aimY);
await page.waitForTimeout(350);
const aimed = await probe();
await page.screenshot({ path: `${out}/twin-aim.png` });

await page.evaluate(() => window.__controlsTest?.setKeys?.(["KeyA"]));
await page.waitForTimeout(500);
const strafed = await probe();
await page.evaluate(() => window.__controlsTest?.setKeys?.([]));
await page.screenshot({ path: `${out}/twin-strafe.png` });
const yawDelta = wrap((strafed?.yaw ?? 0) - (aimed?.yaw ?? 0));
const movedLeft = (strafed?.x ?? 0) < (aimed?.x ?? 0) - 12;
console.log("mouse-aim", { aimed, strafed, yawDelta, movedLeft });
if (!movedLeft) {
  console.log("FAIL strafe while aiming did not move left");
  process.exitCode = 1;
}

// --- Fake standard gamepad: right stick aims, left stick strafes ---
await page.evaluate(() => {
  const fake = {
    id: "qa-pad",
    index: 0,
    connected: true,
    mapping: "standard",
    axes: [0, 0, 0.85, -0.35, 0, 0],
    buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })),
    timestamp: performance.now(),
    vibrationActuator: null,
  };
  Object.defineProperty(navigator, "getGamepads", { configurable: true, value: () => [fake] });
  window.dispatchEvent(new Event("gamepadconnected"));
  window.__qaPad = fake;
});
await page.waitForTimeout(400);
const padAimed = await probe();
const expected = Math.atan2(-0.35, 0.85);
const padAimErr = Math.abs(wrap((padAimed?.want ?? 0) - expected));
console.log("pad-aim", { padAimed, expected, padAimErr });
if (padAimErr > 0.08) {
  console.log("FAIL pad right stick did not set desired aim");
  process.exitCode = 1;
}
if (Math.abs(wrap((padAimed?.yaw ?? 0) - expected)) > 0.18) {
  console.log("FAIL hull did not yaw onto pad aim");
  process.exitCode = 1;
}

await page.evaluate(() => {
  if (window.__qaPad) window.__qaPad.axes = [-0.9, 0, 0.85, -0.35, 0, 0];
});
const padX0 = padAimed?.x ?? 0;
await page.waitForTimeout(400);
const padStrafe = await probe();
const padYawDelta = wrap((padStrafe?.yaw ?? 0) - (padAimed?.yaw ?? 0));
console.log("pad-strafe", { padStrafe, padYawDelta });
if ((padStrafe?.x ?? 0) > padX0 - 8) {
  console.log("FAIL pad left stick did not strafe left");
  process.exitCode = 1;
}
await page.screenshot({ path: `${out}/twin-pad.png` });

const mobile = await browser.newPage({
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});
await mobile.goto("http://127.0.0.1:8080/", { waitUntil: "domcontentloaded" });
await mobile.waitForTimeout(400);
await mobile.getByRole("button", { name: "Engage" }).click();
await mobile.waitForTimeout(400);
const mobileText = await mobile.evaluate(() => document.body.innerText);
console.log("mobile-labels", /Move/i.test(mobileText), /Aim/i.test(mobileText));
await mobile.screenshot({ path: `${out}/twin-mobile.png` });
await mobile.close();

console.log("console-errors", errors);
if (errors.length) process.exitCode = 1;
if (!process.exitCode) console.log("QA PASS");
await browser.close();
