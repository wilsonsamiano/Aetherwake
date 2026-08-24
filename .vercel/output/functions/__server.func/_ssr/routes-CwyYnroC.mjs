import { i as __toESM } from "../_runtime.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { v as require_jsx_runtime } from "../_libs/@tanstack/react-router+[...].mjs";
import { c as Pause, d as Gamepad2, i as Volume2, l as Map, n as X, o as Shield, r as VolumeX, s as Play, t as Zap, u as Gauge } from "../_libs/lucide-react.mjs";
import { t as create } from "../_libs/zustand.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as Slot } from "../_libs/radix-ui__react-slot.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CwyYnroC.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var bus = null;
function makeCtx() {
	return new (window.AudioContext || window.webkitAudioContext)({ latencyHint: "interactive" });
}
function unlockAudio() {
	if (!bus) {
		const ctx = makeCtx();
		const master = ctx.createGain();
		const sfx = ctx.createGain();
		sfx.connect(master);
		master.connect(ctx.destination);
		master.gain.value = .7;
		sfx.gain.value = .9;
		bus = {
			ctx,
			master,
			sfx,
			muted: false
		};
	}
	if (bus.ctx.state === "suspended") bus.ctx.resume();
}
function setMuted(muted) {
	if (!bus) return;
	bus.muted = muted;
	bus.master.gain.setTargetAtTime(muted ? 0 : .7, bus.ctx.currentTime, .02);
}
function resumeAudio() {
	if (bus && bus.ctx.state === "suspended") bus.ctx.resume();
}
function envGain(ctx, dest, attack, hold, release, peak = .2) {
	const g = ctx.createGain();
	g.gain.value = 0;
	g.connect(dest);
	const t = ctx.currentTime;
	g.gain.setValueAtTime(0, t);
	g.gain.linearRampToValueAtTime(peak, t + attack);
	g.gain.setValueAtTime(peak, t + attack + hold);
	g.gain.exponentialRampToValueAtTime(1e-4, t + attack + hold + release);
	return {
		g,
		start: t,
		stop: t + attack + hold + release + .02
	};
}
function tone(freq, type, dur, peak = .12, slide) {
	if (!bus || bus.muted) return;
	const { ctx, sfx } = bus;
	const { g, start, stop } = envGain(ctx, sfx, .004, Math.max(.01, dur * .4), dur * .6, peak);
	const o = ctx.createOscillator();
	o.type = type;
	o.frequency.setValueAtTime(freq, start);
	if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * slide), stop);
	o.connect(g);
	o.start(start);
	o.stop(stop);
}
function noise(dur, peak = .16, hp = 400) {
	if (!bus || bus.muted) return;
	const { ctx, sfx } = bus;
	const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
	const d = n.getChannelData(0);
	for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
	const src = ctx.createBufferSource();
	src.buffer = n;
	const f = ctx.createBiquadFilter();
	f.type = "highpass";
	f.frequency.value = hp;
	const { g, start, stop } = envGain(ctx, sfx, .002, dur * .2, dur * .8, peak);
	src.connect(f);
	f.connect(g);
	src.start(start);
	src.stop(stop);
}
function sfx(name) {
	const rate = 1 + (Math.random() * .16 - .08);
	switch (name) {
		case "shoot":
			tone(680 * rate, "square", .06, .05, .55);
			break;
		case "hit":
			tone(220 * rate, "sawtooth", .05, .07, .4);
			noise(.04, .08, 800);
			break;
		case "explode":
			noise(.22, .22, 180);
			tone(140 * rate, "sawtooth", .18, .1, .3);
			break;
		case "pickup":
			tone(520, "sine", .08, .08, 1.4);
			tone(780, "sine", .1, .06, 1.2);
			break;
		case "hurt":
			tone(90, "square", .16, .12, .5);
			noise(.12, .14, 200);
			break;
		case "wave":
			tone(240, "triangle", .22, .08, 2.1);
			break;
		case "ui":
			tone(440, "sine", .05, .05);
			break;
		case "dash":
			noise(.1, .1, 1200);
			tone(180, "sine", .12, .06, 2.4);
			break;
		case "over":
			tone(200, "triangle", .3, .1, .5);
			tone(140, "sine", .4, .08, .4);
	}
}
var gameInput = null;
var GAME_KEYS = /* @__PURE__ */ new Set([
	"KeyW",
	"KeyA",
	"KeyS",
	"KeyD",
	"ArrowUp",
	"ArrowDown",
	"ArrowLeft",
	"ArrowRight",
	"Space",
	"ShiftLeft",
	"ShiftRight",
	"KeyP",
	"Escape",
	"Enter"
]);
function radial(x, y, dz = .18) {
	const m = Math.hypot(x, y);
	if (m < dz) return {
		x: 0,
		y: 0,
		m: 0
	};
	const scale = (m - dz) / (1 - dz) / m;
	return {
		x: x * scale,
		y: y * scale,
		m
	};
}
var Input = class {
	keys = /* @__PURE__ */ new Set();
	injected = /* @__PURE__ */ new Set();
	pointer = {
		x: 0,
		y: 0,
		moved: false
	};
	touchMove = {
		active: false,
		x: 0,
		y: 0
	};
	touchAim = {
		active: false,
		x: 0,
		y: 0
	};
	canvas = null;
	padLive = false;
	aimSource = "none";
	pauseQueued = false;
	dashQueued = false;
	confirmQueued = false;
	prevPause = false;
	prevDash = false;
	prevConfirm = false;
	prevPadPause = false;
	prevPadDash = false;
	prevPadConfirm = false;
	onPad;
	attach(canvas) {
		this.canvas = canvas;
		gameInput = this;
		window.addEventListener("keydown", this.onKeyDown);
		window.addEventListener("keyup", this.onKeyUp);
		window.addEventListener("blur", this.clearKeys);
		document.addEventListener("visibilitychange", this.onVis);
		window.addEventListener("pointermove", this.onPointerMove);
		window.addEventListener("gamepadconnected", this.onPadOn);
		window.addEventListener("gamepaddisconnected", this.onPadOff);
	}
	detach() {
		if (gameInput === this) gameInput = null;
		window.removeEventListener("keydown", this.onKeyDown);
		window.removeEventListener("keyup", this.onKeyUp);
		window.removeEventListener("blur", this.clearKeys);
		document.removeEventListener("visibilitychange", this.onVis);
		window.removeEventListener("pointermove", this.onPointerMove);
		window.removeEventListener("gamepadconnected", this.onPadOn);
		window.removeEventListener("gamepaddisconnected", this.onPadOff);
	}
	setTouchMove(x, y, active) {
		this.touchMove = {
			active,
			x,
			y
		};
	}
	setTouchAim(x, y, active) {
		this.touchAim = {
			active,
			x,
			y
		};
		if (active) this.aimSource = "touch";
	}
	setKeys(codes) {
		this.injected = new Set(codes);
	}
	/** Drop mouse aim so a menu click doesn't yank the nose. */
	clearPointerAim() {
		this.pointer.moved = false;
		this.aimSource = "none";
	}
	clientToWorld(clientX, clientY) {
		const c = this.canvas;
		if (!c) return {
			x: 0,
			y: 0
		};
		const r = c.getBoundingClientRect();
		const x = (clientX - r.left) / r.width * c.width;
		const y = (clientY - r.top) / r.height * c.height;
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		return {
			x: x / dpr,
			y: y / dpr
		};
	}
	sample() {
		const keys = /* @__PURE__ */ new Set([...this.keys, ...this.injected]);
		let mx = 0;
		let my = 0;
		if (keys.has("KeyA") || keys.has("ArrowLeft")) mx -= 1;
		if (keys.has("KeyD") || keys.has("ArrowRight")) mx += 1;
		if (keys.has("KeyW") || keys.has("ArrowUp")) my -= 1;
		if (keys.has("KeyS") || keys.has("ArrowDown")) my += 1;
		const pad = this.readPad();
		mx += pad.mx;
		my += pad.my;
		if (this.touchMove.active) {
			mx += this.touchMove.x;
			my += this.touchMove.y;
		}
		const mlen = Math.hypot(mx, my);
		if (mlen > 1) {
			mx /= mlen;
			my /= mlen;
		}
		let aimSX = 0;
		let aimSY = 0;
		if (this.touchAim.active) {
			aimSX = this.touchAim.x;
			aimSY = this.touchAim.y;
			this.aimSource = "touch";
		} else if (pad.aiming) {
			aimSX = pad.ax;
			aimSY = pad.ay;
			this.aimSource = "pad";
		}
		if (pad.connected) this.padLive = true;
		else if (!pad.connected && this.aimSource === "pad") this.aimSource = "none";
		const usingPad = this.padLive && this.aimSource !== "touch";
		const usingTouch = this.touchMove.active || this.touchAim.active;
		const hasPointer = this.aimSource === "pointer" && this.pointer.moved && !usingTouch;
		const fire = true;
		const pauseHeld = keys.has("Escape") || keys.has("KeyP") || this.pauseQueued;
		const pauseEdge = pauseHeld && !this.prevPause || pad.pause && !this.prevPadPause || this.pauseQueued;
		this.prevPause = pauseHeld;
		this.prevPadPause = pad.pause;
		this.pauseQueued = false;
		const dashHeld = keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("Space") || this.dashQueued;
		const dashEdge = dashHeld && !this.prevDash || pad.dash && !this.prevPadDash || this.dashQueued;
		this.prevDash = dashHeld;
		this.prevPadDash = pad.dash;
		this.dashQueued = false;
		const confirmHeld = keys.has("Enter") || this.confirmQueued;
		const confirmEdge = confirmHeld && !this.prevConfirm || pad.confirm && !this.prevPadConfirm || this.confirmQueued;
		this.prevConfirm = confirmHeld;
		this.prevPadConfirm = pad.confirm;
		this.confirmQueued = false;
		return {
			moveX: mx,
			moveY: my,
			aimSX,
			aimSY,
			pointerX: this.pointer.x,
			pointerY: this.pointer.y,
			hasPointer,
			usingPad,
			usingTouch,
			fire,
			dash: dashEdge,
			pause: pauseEdge,
			confirm: confirmEdge
		};
	}
	rumble(strong = .4, weak = .6, ms = 80) {
		if (typeof navigator === "undefined" || !navigator.getGamepads) return;
		for (const p of navigator.getGamepads()) {
			const act = p?.vibrationActuator;
			if (!act) continue;
			act.playEffect("dual-rumble", {
				startDelay: 0,
				duration: ms,
				strongMagnitude: strong,
				weakMagnitude: weak
			}).catch(() => {});
		}
	}
	readPad() {
		const empty = {
			mx: 0,
			my: 0,
			ax: 0,
			ay: 0,
			aiming: false,
			fire: false,
			dash: false,
			pause: false,
			confirm: false,
			active: false,
			connected: false
		};
		if (typeof navigator === "undefined" || !navigator.getGamepads) return empty;
		const pads = [...navigator.getGamepads()].filter((p) => !!p && p.axes.length >= 2);
		const p = pads.find((g) => g.mapping === "standard") ?? pads[0];
		if (!p) return empty;
		const l = radial(p.axes[0] ?? 0, p.axes[1] ?? 0);
		const r = p.axes.length >= 4 ? radial(p.axes[2] ?? 0, p.axes[3] ?? 0, .22) : {
			x: 0,
			y: 0,
			m: 0
		};
		const b = (i) => !!p.buttons[i]?.pressed;
		const v = (i) => p.buttons[i]?.value ?? 0;
		let mx = l.x;
		let my = l.y;
		if (b(14)) mx -= 1;
		if (b(15)) mx += 1;
		if (b(12)) my -= 1;
		if (b(13)) my += 1;
		const fire = b(7) || b(0) || v(7) > .35 || r.m > .25;
		const dash = b(4) || b(5) || b(6) || v(6) > .6;
		const pause = b(9) || b(8);
		const confirm = b(0);
		const active = l.m > 0 || r.m > 0 || fire || dash || pause || confirm || b(12) || b(13) || b(14) || b(15);
		return {
			mx,
			my,
			ax: r.x,
			ay: r.y,
			aiming: r.m > 0,
			fire,
			dash,
			pause,
			confirm,
			active,
			connected: true
		};
	}
	onKeyDown = (e) => {
		if (GAME_KEYS.has(e.code)) e.preventDefault();
		this.keys.add(e.code);
		if (e.code === "Escape" || e.code === "KeyP") this.pauseQueued = true;
		if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "Space") this.dashQueued = true;
		if (e.code === "Enter") this.confirmQueued = true;
	};
	onKeyUp = (e) => {
		this.keys.delete(e.code);
	};
	clearKeys = () => {
		this.keys.clear();
	};
	onVis = () => {
		if (document.hidden) this.clearKeys();
	};
	onPointerMove = (e) => {
		if (e.pointerType === "touch") return;
		const w = this.clientToWorld(e.clientX, e.clientY);
		this.pointer.x = w.x;
		this.pointer.y = w.y;
		this.pointer.moved = true;
		this.aimSource = "pointer";
	};
	onPadOn = () => {
		this.padLive = true;
		this.onPad?.(true);
	};
	onPadOff = () => {
		this.padLive = false;
		if (this.aimSource === "pad") this.aimSource = "none";
		this.onPad?.(false);
	};
};
var SKILLS = [
	{
		id: "core",
		name: "Wake Core",
		desc: "The ship’s living heart. Already online.",
		cost: 0,
		x: .5,
		y: .5,
		requires: []
	},
	{
		id: "hull1",
		name: "Plated Hull",
		desc: "+2 maximum hull.",
		cost: 1,
		x: .5,
		y: .28,
		requires: ["core"]
	},
	{
		id: "hull2",
		name: "Bulkheads",
		desc: "+2 maximum hull.",
		cost: 2,
		x: .5,
		y: .14,
		requires: ["hull1"]
	},
	{
		id: "regen",
		name: "Nanite Weave",
		desc: "Slow hull regeneration in combat.",
		cost: 2,
		x: .64,
		y: .14,
		requires: ["hull2"]
	},
	{
		id: "cannon1",
		name: "Rapid Coil",
		desc: "Fire 25% faster.",
		cost: 1,
		x: .68,
		y: .5,
		requires: ["core"]
	},
	{
		id: "cannon2",
		name: "Hot Cores",
		desc: "Shots deal 40% more damage.",
		cost: 2,
		x: .82,
		y: .5,
		requires: ["cannon1"]
	},
	{
		id: "spread",
		name: "Tri-Vane",
		desc: "Permanent extra side shots.",
		cost: 3,
		x: .94,
		y: .36,
		requires: ["cannon2"]
	},
	{
		id: "pierce",
		name: "Phase Tips",
		desc: "Shots pierce one extra target.",
		cost: 2,
		x: .82,
		y: .68,
		requires: ["cannon2"]
	},
	{
		id: "homing",
		name: "Seek Lattice",
		desc: "Shots gently curve toward foes.",
		cost: 3,
		x: .94,
		y: .68,
		requires: ["pierce"]
	},
	{
		id: "drive1",
		name: "Afterburn",
		desc: "+18% engine speed.",
		cost: 1,
		x: .32,
		y: .5,
		requires: ["core"]
	},
	{
		id: "drive2",
		name: "Slipstream",
		desc: "+18% engine speed.",
		cost: 2,
		x: .18,
		y: .5,
		requires: ["drive1"]
	},
	{
		id: "dash",
		name: "Blink Drive",
		desc: "Shift / dash to burst forward.",
		cost: 2,
		x: .18,
		y: .68,
		requires: ["drive2"]
	},
	{
		id: "overcharge",
		name: "Overcharge",
		desc: "Fire rate and damage both climb.",
		cost: 3,
		x: .08,
		y: .36,
		requires: ["drive2"]
	},
	{
		id: "shield1",
		name: "Aegis Ring",
		desc: "Start each life with a shield.",
		cost: 1,
		x: .5,
		y: .7,
		requires: ["core"]
	},
	{
		id: "shield2",
		name: "Double Aegis",
		desc: "Larger shield capacity.",
		cost: 2,
		x: .36,
		y: .86,
		requires: ["shield1"]
	},
	{
		id: "magnet",
		name: "Salvage Well",
		desc: "Pull pickups from farther away.",
		cost: 2,
		x: .64,
		y: .86,
		requires: ["shield1"]
	}
];
var SKILL_BY_ID = Object.fromEntries(SKILLS.map((s) => [s.id, s]));
var SKILL_EDGES = SKILLS.flatMap((s) => s.requires.map((r) => [r, s.id]));
function isAvailable(id, owned) {
	if (owned.has(id)) return false;
	return SKILL_BY_ID[id].requires.every((r) => owned.has(r));
}
function applyOwnedToPlayer(owned) {
	return {
		maxHp: 5 + (owned.has("hull1") ? 2 : 0) + (owned.has("hull2") ? 2 : 0),
		fireMul: (owned.has("cannon1") ? 1.25 : 1) * (owned.has("overcharge") ? 1.2 : 1),
		dmgMul: (owned.has("cannon2") ? 1.4 : 1) * (owned.has("overcharge") ? 1.2 : 1),
		extraShots: owned.has("spread") ? 2 : 0,
		pierce: owned.has("pierce") ? 1 : 0,
		homing: owned.has("homing") ? 1 : 0,
		speedMul: (owned.has("drive1") ? 1.18 : 1) * (owned.has("drive2") ? 1.18 : 1),
		maxShield: owned.has("shield2") ? 6 : owned.has("shield1") ? 3 : 0,
		magnet: owned.has("magnet") ? 160 : 72,
		regen: owned.has("regen") ? .35 : 0,
		canDash: owned.has("dash")
	};
}
function loadSheet(src, cols, rows) {
	return new Promise((resolve) => {
		const img = new Image();
		img.crossOrigin = "anonymous";
		img.onload = () => {
			resolve({
				img,
				cols,
				rows,
				fw: img.naturalWidth / cols,
				fh: img.naturalHeight / rows
			});
		};
		img.onerror = () => resolve(null);
		img.src = src;
	});
}
async function loadAtlas() {
	const [player, enemies, powerups, explode, muzzle, boltPlayer, boltEnemy] = await Promise.all([
		loadSheet("/sprites/player.png", 1, 1),
		loadSheet("/sprites/enemies.png", 2, 2),
		loadSheet("/sprites/powerups.png", 2, 2),
		loadSheet("/sprites/explode.png", 2, 2),
		loadSheet("/sprites/muzzle.png", 2, 2),
		loadSheet("/sprites/bolt-player.png", 2, 2),
		loadSheet("/sprites/bolt-enemy.png", 2, 2)
	]);
	return {
		player,
		enemies,
		powerups,
		explode,
		muzzle,
		boltPlayer,
		boltEnemy
	};
}
function drawFrame(ctx, sheet, frame, x, y, w, h, rot = 0, alpha = 1, sx = 1, sy = 1) {
	const col = frame % sheet.cols;
	const row = Math.floor(frame / sheet.cols) % sheet.rows;
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rot);
	ctx.scale(sx, sy);
	ctx.globalAlpha *= alpha;
	ctx.drawImage(sheet.img, col * sheet.fw, row * sheet.fh, sheet.fw, sheet.fh, -w / 2, -h / 2, w, h);
	ctx.restore();
}
var KEY = "aetherwake-save";
var VERSION = 1;
var MAX_SCORES = 8;
var DEFAULTS = {
	version: VERSION,
	scores: [],
	settings: {
		mute: false,
		shake: true
	}
};
function migrate(raw) {
	const s = {
		...DEFAULTS,
		...raw,
		settings: {
			...DEFAULTS.settings,
			...raw.settings
		}
	};
	s.version = VERSION;
	s.scores = Array.isArray(s.scores) ? s.scores.slice(0, MAX_SCORES) : [];
	return s;
}
function loadSave() {
	try {
		const raw = localStorage.getItem(KEY);
		if (!raw) return structuredClone(DEFAULTS);
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") return structuredClone(DEFAULTS);
		return migrate(parsed);
	} catch {
		return structuredClone(DEFAULTS);
	}
}
function writeSave(data) {
	try {
		localStorage.setItem(KEY, JSON.stringify(data));
	} catch {}
}
function loadSettings() {
	return loadSave().settings;
}
function saveSettings(settings) {
	const data = loadSave();
	data.settings = settings;
	writeSave(data);
}
function getScores() {
	return loadSave().scores;
}
function qualifies(score) {
	const scores = getScores();
	if (scores.length < MAX_SCORES) return score > 0;
	return score > (scores[scores.length - 1]?.score ?? 0);
}
function submitScore(row) {
	const data = loadSave();
	data.scores = [...data.scores, row].sort((a, b) => b.score - a.score || b.wave - a.wave).slice(0, MAX_SCORES);
	writeSave(data);
	return data.scores;
}
var EMPTY_HUD = {
	score: 0,
	lives: 3,
	hp: 5,
	maxHp: 5,
	shield: 0,
	maxShield: 0,
	wave: 0,
	forge: 0,
	combo: 0,
	multiT: 0,
	speedT: 0,
	banner: "",
	dashCd: 0,
	unspent: 0,
	padOn: false
};
var useGame = create((set) => ({
	phase: "title",
	hud: EMPTY_HUD,
	scores: getScores(),
	settings: loadSettings(),
	qualify: false,
	lastScore: 0,
	lastWave: 0,
	owned: ["core"],
	api: null,
	setPhase: (phase) => set({ phase }),
	setHud: (hud) => set({ hud }),
	setApi: (api) => set({ api }),
	setScores: (scores) => set({ scores }),
	setSettings: (settings) => set({ settings }),
	setOwned: (owned) => set({ owned }),
	setQualify: (qualify, lastScore, lastWave) => set({
		qualify,
		lastScore,
		lastWave
	})
}));
var STEP = 1 / 60;
var MAX_DT = .1;
var PAD = 28;
var ENEMY_CAP = 72;
var BULLET_CAP = 220;
var PART_CAP = 420;
var KIND = {
	scout: {
		hp: 2,
		spd: 155,
		r: 14,
		value: 100,
		fire: 0,
		frame: 0
	},
	fighter: {
		hp: 5,
		spd: 100,
		r: 18,
		value: 250,
		fire: 1.55,
		frame: 1
	},
	bomber: {
		hp: 11,
		spd: 72,
		r: 22,
		value: 420,
		fire: 2.1,
		frame: 2
	},
	cruiser: {
		hp: 48,
		spd: 46,
		r: 36,
		value: 1600,
		fire: 1.05,
		frame: 3
	}
};
var PICK_FRAME = {
	multi: 0,
	shield: 1,
	speed: 2,
	repair: 3
};
function pool(n, make) {
	return Array.from({ length: n }, make);
}
function clamp(v, a, b) {
	return v < a ? a : v > b ? b : v;
}
function rand(a, b) {
	return a + Math.random() * (b - a);
}
function pick(arr) {
	return arr[Math.random() * arr.length | 0];
}
function wrapAng(a) {
	return Math.atan2(Math.sin(a), Math.cos(a));
}
var Game = class {
	canvas;
	ctx;
	input = new Input();
	atlas = null;
	raf = 0;
	acc = 0;
	last = 0;
	hudT = 0;
	w = 800;
	h = 600;
	phase = "title";
	player;
	enemies = pool(ENEMY_CAP, () => ({
		alive: false,
		kind: "scout",
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		hp: 0,
		maxHp: 1,
		r: 12,
		value: 0,
		fireCd: 0,
		flash: 0,
		knock: 0,
		aim: 0
	}));
	bullets = pool(BULLET_CAP, () => ({
		alive: false,
		friendly: true,
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		r: 4,
		dmg: 1,
		ttl: 0,
		pierce: 0,
		homing: 0,
		rot: 0
	}));
	pickups = pool(24, () => ({
		alive: false,
		kind: "multi",
		x: 0,
		y: 0,
		ttl: 0,
		bob: 0
	}));
	parts = pool(PART_CAP, () => ({
		alive: false,
		x: 0,
		y: 0,
		vx: 0,
		vy: 0,
		life: 0,
		max: 1,
		size: 2,
		color: "#fff",
		drag: 1,
		additive: false
	}));
	floaters = pool(40, () => ({
		alive: false,
		x: 0,
		y: 0,
		vy: 0,
		text: "",
		life: 0,
		color: "#fff"
	}));
	muzzles = pool(16, () => ({
		alive: false,
		x: 0,
		y: 0,
		rot: 0,
		life: 0,
		max: .08
	}));
	stars = [];
	owned = /* @__PURE__ */ new Set(["core"]);
	canDash = false;
	forge = 0;
	score = 0;
	wave = 0;
	combo = 0;
	comboT = 0;
	waveWait = 0;
	inWave = false;
	banner = "";
	bannerT = 0;
	trauma = 0;
	hitstop = 0;
	reduced = false;
	shakeOn = true;
	t = 0;
	fromPause = false;
	aimVis = {
		showPointer: false,
		px: 0,
		py: 0
	};
	padOn = false;
	apiHandle = null;
	ro = null;
	vis = () => {
		resumeAudio();
		if (document.hidden && this.phase === "playing") this.setPhase("paused");
	};
	constructor(canvas) {
		this.canvas = canvas;
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Canvas 2D unavailable");
		this.ctx = ctx;
		this.reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
		this.shakeOn = useGame.getState().settings.shake;
		setMuted(useGame.getState().settings.mute);
		this.resize();
		this.input.pointer.x = this.w / 2;
		this.input.pointer.y = this.h / 2;
		this.input.attach(canvas);
		this.input.onPad = (on) => {
			this.padOn = on;
			if (on) {
				this.banner = "Controller · left stick move · right stick aim";
				this.bannerT = 2.4;
			}
		};
		this.seedStars();
		this.resetPlayer(true);
		this.ro = new ResizeObserver(() => this.resize());
		this.ro.observe(canvas);
		document.addEventListener("visibilitychange", this.vis);
		loadAtlas().then((a) => {
			this.atlas = a;
		});
		this.publishHud();
		this.bindApi();
		this.setPhase("title");
		this.bindControlsTest();
	}
	startLoop() {
		this.last = performance.now();
		const tick = (now) => {
			this.raf = requestAnimationFrame(tick);
			let dt = (now - this.last) / 1e3;
			this.last = now;
			if (dt > MAX_DT) dt = MAX_DT;
			this.acc += dt;
			const frozen = this.phase === "title" || this.phase === "paused" || this.phase === "skills" || this.phase === "scores" || this.phase === "help" || this.phase === "gameover";
			const actions = this.input.sample();
			this.handlePhaseInput(actions);
			while (this.acc >= STEP) {
				this.acc -= STEP;
				if (this.hitstop > 0) {
					this.hitstop -= STEP;
					continue;
				}
				if (!frozen) this.step(STEP, actions);
				else if (this.phase === "title") this.stepAttract(STEP);
			}
			this.draw();
			this.hudT += dt;
			if (this.hudT > .08) {
				this.hudT = 0;
				this.publishHud();
			}
		};
		this.raf = requestAnimationFrame(tick);
	}
	destroy() {
		cancelAnimationFrame(this.raf);
		this.input.detach();
		this.ro?.disconnect();
		document.removeEventListener("visibilitychange", this.vis);
		if (useGame.getState().api === this.apiHandle) useGame.getState().setApi(null);
		if (typeof window !== "undefined" && window.__controlsTest === this.controlsProbe) delete window.__controlsTest;
	}
	bindApi() {
		this.apiHandle = {
			start: () => this.startRun(),
			resume: () => this.setPhase("playing"),
			pause: () => {
				if (this.phase === "playing") this.setPhase("paused");
			},
			openSkills: () => {
				if (this.phase === "playing" || this.phase === "paused") {
					this.fromPause = this.phase === "paused";
					this.setPhase("skills");
				}
			},
			closeSkills: () => {
				if (this.wave === 0) this.setPhase("title");
				else this.setPhase(this.fromPause ? "paused" : "playing");
			},
			buySkill: (id) => this.buySkill(id),
			submitName: (name) => this.submitName(name),
			toTitle: () => {
				this.clearCombat();
				this.wave = 0;
				this.setPhase("title");
			},
			toScores: () => this.setPhase("scores"),
			toHelp: () => this.setPhase("help"),
			setSettings: (s) => {
				const cur = {
					...useGame.getState().settings,
					...s
				};
				saveSettings(cur);
				useGame.getState().setSettings(cur);
				setMuted(cur.mute);
				this.shakeOn = cur.shake;
			},
			owned: () => this.owned,
			forge: () => this.forge
		};
		useGame.getState().setApi(this.apiHandle);
	}
	controlsProbe = {
		getYaw: () => this.player.aim,
		getWant: () => this.player.want,
		getOmega: () => this.player.omega,
		getSpeed: () => Math.hypot(this.player.vx, this.player.vy),
		getX: () => this.player.x,
		getY: () => this.player.y,
		setKeys: (codes) => this.input.setKeys(codes),
		setSteer: (v) => {
			if (v > .2) this.input.setKeys(["KeyA"]);
			else if (v < -.2) this.input.setKeys(["KeyD"]);
			else this.input.setKeys([]);
		}
	};
	bindControlsTest() {
		if (typeof window === "undefined") return;
		window.__controlsTest = this.controlsProbe;
	}
	setPhase(phase) {
		this.phase = phase;
		useGame.getState().setPhase(phase);
	}
	startRun() {
		unlockAudio();
		sfx("wave");
		this.owned = /* @__PURE__ */ new Set(["core"]);
		this.forge = 0;
		this.score = 0;
		this.wave = 0;
		this.combo = 0;
		this.comboT = 0;
		this.trauma = 0;
		this.clearCombat();
		this.resetPlayer(true);
		this.input.clearPointerAim();
		this.setPhase("playing");
		this.nextWave();
		useGame.getState().setOwned(["core"]);
		useGame.getState().setQualify(false, 0, 0);
	}
	submitName(name) {
		const scores = submitScore({
			name: name.trim().slice(0, 12) || "Pilot",
			score: this.score,
			wave: this.wave,
			at: Date.now()
		});
		useGame.getState().setScores(scores);
		this.setPhase("scores");
	}
	buySkill(id) {
		const def = SKILL_BY_ID[id];
		if (!def || this.owned.has(id)) return false;
		if (!isAvailable(id, this.owned)) return false;
		if (this.forge < def.cost) return false;
		this.forge -= def.cost;
		this.owned.add(id);
		this.applySkills(false);
		useGame.getState().setOwned([...this.owned]);
		sfx("ui");
		this.float(this.player.x, this.player.y - 24, def.name, "#8eb8c8");
		this.publishHud();
		return true;
	}
	applySkills(fill) {
		const st = applyOwnedToPlayer(this.owned);
		const p = this.player;
		const hpGain = st.maxHp - p.maxHp;
		p.maxHp = st.maxHp;
		if (hpGain > 0) p.hp = Math.min(p.maxHp, p.hp + hpGain);
		p.fireMul = st.fireMul;
		p.dmgMul = st.dmgMul;
		p.extraShots = st.extraShots;
		p.pierce = st.pierce;
		p.homing = st.homing;
		p.speedMul = st.speedMul;
		const shGain = st.maxShield - p.maxShield;
		p.maxShield = st.maxShield;
		if (shGain > 0) p.shield = Math.min(p.maxShield, p.shield + shGain);
		if (fill && p.maxShield) p.shield = p.maxShield;
		p.magnet = st.magnet;
		p.regen = st.regen;
		this.canDash = st.canDash;
	}
	resetPlayer(full) {
		const p = this.player ?? {};
		p.x = this.w / 2;
		p.y = this.h / 2;
		p.vx = 0;
		p.vy = 0;
		p.aim = -Math.PI / 2;
		p.want = p.aim;
		p.omega = 0;
		p.invuln = full ? 0 : 2.2;
		p.deadT = 0;
		p.fireCd = 0;
		p.dashCd = 0;
		p.multiT = 0;
		p.speedT = 0;
		p.regenAcc = 0;
		p.radius = 16;
		p.lives = full ? 3 : p.lives;
		this.player = p;
		if (full) {
			p.hp = 5;
			p.maxHp = 5;
			p.shield = 0;
			p.maxShield = 0;
			p.magnet = 72;
			p.extraShots = 0;
			p.fireMul = 1;
			p.dmgMul = 1;
			p.pierce = 0;
			p.homing = 0;
			p.speedMul = 1;
			p.regen = 0;
			this.canDash = false;
		} else {
			this.applySkills(true);
			p.hp = p.maxHp;
		}
	}
	clearCombat() {
		for (const e of this.enemies) e.alive = false;
		for (const b of this.bullets) b.alive = false;
		for (const p of this.pickups) p.alive = false;
		for (const p of this.parts) p.alive = false;
		for (const f of this.floaters) f.alive = false;
		for (const m of this.muzzles) m.alive = false;
		this.inWave = false;
		this.waveWait = 0;
	}
	resize() {
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		const r = this.canvas.getBoundingClientRect();
		const w = Math.max(320, r.width);
		const h = Math.max(320, r.height);
		this.canvas.width = Math.round(w * dpr);
		this.canvas.height = Math.round(h * dpr);
		this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		this.w = w;
		this.h = h;
		if (this.stars.length) this.seedStars();
	}
	seedStars() {
		const n = Math.min(220, Math.floor(this.w * this.h / 2800));
		this.stars = Array.from({ length: n }, () => ({
			x: Math.random() * this.w,
			y: Math.random() * this.h,
			z: pick([
				.18,
				.45,
				.85,
				1.15
			]),
			s: rand(.6, 2.2)
		}));
	}
	handlePhaseInput(a) {
		if (a.pause) {
			if (this.phase === "title") this.startRun();
			else if (this.phase === "playing") this.setPhase("paused");
			else if (this.phase === "paused") this.setPhase("playing");
			else if (this.phase === "skills") this.setPhase(this.fromPause ? "paused" : "playing");
			else if (this.phase === "help" || this.phase === "scores") this.setPhase("title");
		}
		if (a.confirm) {
			if (this.phase === "title" || this.phase === "help" || this.phase === "scores") this.startRun();
			else if (this.phase === "paused") this.setPhase("playing");
			else if (this.phase === "gameover" && !useGame.getState().qualify) this.startRun();
		}
	}
	nextWave() {
		this.wave += 1;
		this.inWave = true;
		this.waveWait = 2.4;
		this.banner = this.wave % 5 === 0 ? `Cruiser inbound · Wave ${this.wave}` : `Wave ${this.wave}`;
		this.bannerT = 2.1;
		sfx("wave");
		const n = this.wave;
		let spawned = 0;
		const spawn = (kind, count) => {
			for (let i = 0; i < count; i++) if (this.spawnEnemy(kind)) spawned += 1;
		};
		spawn("scout", 3 + n);
		spawn("fighter", Math.max(0, n - 1));
		spawn("bomber", Math.max(0, Math.floor((n - 3) / 2)));
		if (n % 5 === 0) spawn("cruiser", 1);
		if (n >= 8) spawn("fighter", Math.floor(n / 4));
		if (spawned === 0) {
			this.spawnEnemy("scout");
			this.spawnEnemy("scout");
		}
	}
	spawnEnemy(kind) {
		const e = this.enemies.find((x) => !x.alive);
		if (!e) return false;
		const spec = KIND[kind];
		const edge = Math.random() * 4 | 0;
		let x = 0;
		let y = 0;
		if (edge === 0) {
			x = rand(0, this.w);
			y = -20;
		} else if (edge === 1) {
			x = rand(0, this.w);
			y = this.h + 20;
		} else if (edge === 2) {
			x = -20;
			y = rand(0, this.h);
		} else {
			x = this.w + 20;
			y = rand(0, this.h);
		}
		const dx = this.player.x - x;
		const dy = this.player.y - y;
		if (Math.hypot(dx, dy) < 140) {
			x = this.player.x + (dx >= 0 ? -220 : 220);
			y = rand(40, this.h - 40);
		}
		e.alive = true;
		e.kind = kind;
		e.x = x;
		e.y = y;
		e.vx = 0;
		e.vy = 0;
		e.hp = spec.hp + Math.floor(this.wave * (kind === "cruiser" ? 2.2 : .35));
		e.maxHp = e.hp;
		e.r = spec.r;
		e.value = spec.value;
		e.fireCd = rand(.4, spec.fire || 1);
		e.flash = 0;
		e.knock = 0;
		e.aim = Math.atan2(this.player.y - y, this.player.x - x);
		return true;
	}
	spawnPickup(x, y, kind) {
		const p = this.pickups.find((q) => !q.alive);
		if (!p) return;
		p.alive = true;
		p.kind = kind ?? pick([
			"multi",
			"shield",
			"speed",
			"repair"
		]);
		p.x = x;
		p.y = y;
		p.ttl = 12;
		p.bob = Math.random() * Math.PI * 2;
	}
	burst(x, y, n, color, spd, additive = true) {
		for (let i = 0; i < n; i++) {
			const p = this.parts.find((q) => !q.alive);
			if (!p) return;
			const a = Math.random() * Math.PI * 2;
			const s = rand(spd * .3, spd);
			p.alive = true;
			p.x = x;
			p.y = y;
			p.vx = Math.cos(a) * s;
			p.vy = Math.sin(a) * s;
			p.life = p.max = rand(.25, .7);
			p.size = rand(1.4, 3.6);
			p.color = color;
			p.drag = rand(2.2, 4.5);
			p.additive = additive;
		}
	}
	float(x, y, text, color) {
		const f = this.floaters.find((q) => !q.alive);
		if (!f) return;
		f.alive = true;
		f.x = x;
		f.y = y;
		f.vy = -36;
		f.text = text;
		f.life = .85;
		f.color = color;
	}
	muzzle(x, y, rot) {
		const m = this.muzzles.find((q) => !q.alive);
		if (!m) return;
		m.alive = true;
		m.x = x;
		m.y = y;
		m.rot = rot;
		m.life = m.max = .07;
	}
	fireBullet(x, y, ang, spd, friendly, dmg, r, ttl, pierce = 0, homing = 0) {
		const b = this.bullets.find((q) => !q.alive);
		if (!b) return;
		b.alive = true;
		b.friendly = friendly;
		b.x = x;
		b.y = y;
		b.vx = Math.cos(ang) * spd;
		b.vy = Math.sin(ang) * spd;
		b.r = r;
		b.dmg = dmg;
		b.ttl = ttl;
		b.pierce = pierce;
		b.homing = homing;
		b.rot = ang;
	}
	stepAttract(dt) {
		this.t += dt;
		this.driftStars(dt, Math.sin(this.t * .3) * 40, 18);
		for (const p of this.parts) if (p.alive) this.stepPart(p, dt);
	}
	step(dt, a) {
		this.t += dt;
		const p = this.player;
		if (p.deadT > 0) {
			p.deadT -= dt;
			this.driftStars(dt, 0, 0);
			this.stepWorld(dt);
			if (p.deadT <= 0) {
				if (p.lives < 0) this.gameOver();
				else this.resetPlayer(false);
			}
			return;
		}
		let mx = a.moveX;
		let my = a.moveY;
		const maxSpd = 340 * p.speedMul * (p.speedT > 0 ? 1.45 : 1);
		const snap = 1 - Math.exp(-22 * dt);
		const tvx = mx * maxSpd;
		const tvy = my * maxSpd;
		p.vx += (tvx - p.vx) * snap;
		p.vy += (tvy - p.vy) * snap;
		if (a.dash && this.canDash && p.dashCd <= 0) {
			const dx = mx || Math.cos(p.aim);
			const dy = my || Math.sin(p.aim);
			const n = Math.hypot(dx, dy) || 1;
			p.vx += dx / n * 540;
			p.vy += dy / n * 540;
			p.dashCd = 1.45;
			p.invuln = Math.max(p.invuln, .2);
			this.burst(p.x, p.y, 14, "#8eb8c8", 220);
			sfx("dash");
		}
		p.x = clamp(p.x + p.vx * dt, PAD, this.w - PAD);
		p.y = clamp(p.y + p.vy * dt, PAD, this.h - PAD);
		if (p.x === PAD || p.x === this.w - PAD) p.vx *= .2;
		if (p.y === PAD || p.y === this.h - PAD) p.vy *= .2;
		if (Math.hypot(a.aimSX, a.aimSY) > .12) {
			p.want = Math.atan2(a.aimSY, a.aimSX);
			this.aimVis.showPointer = false;
		} else if (a.hasPointer) {
			p.want = Math.atan2(a.pointerY - p.y, a.pointerX - p.x);
			this.aimVis = {
				showPointer: true,
				px: a.pointerX,
				py: a.pointerY
			};
		} else this.aimVis.showPointer = false;
		this.stepYaw(p, dt);
		if (p.fireCd > 0) p.fireCd -= dt;
		if (p.dashCd > 0) p.dashCd -= dt;
		if (p.invuln > 0) p.invuln -= dt;
		if (p.multiT > 0) p.multiT -= dt;
		if (p.speedT > 0) p.speedT -= dt;
		if (p.regen > 0 && p.hp < p.maxHp) {
			p.regenAcc += p.regen * dt;
			if (p.regenAcc >= 1) {
				p.hp = Math.min(p.maxHp, p.hp + 1);
				p.regenAcc -= 1;
			}
		}
		if (a.fire && p.fireCd <= 0) this.shootPlayer();
		this.driftStars(dt, p.vx, p.vy);
		this.stepWorld(dt);
		this.collisions();
		this.waveLogic(dt);
		if (this.comboT > 0) {
			this.comboT -= dt;
			if (this.comboT <= 0) this.combo = 0;
		}
		if (this.bannerT > 0) this.bannerT -= dt;
		else this.banner = "";
		if (this.trauma > 0) this.trauma = Math.max(0, this.trauma - 1.7 * dt);
		if (Math.random() < dt * 18) this.burst(p.x - Math.cos(p.aim) * 12, p.y - Math.sin(p.aim) * 12, 1, "rgba(142,184,200,0.7)", 20, true);
		if (Math.abs(p.omega) > 5 && Math.random() < dt * 22) {
			const side = p.omega > 0 ? 1 : -1;
			const px = p.x + Math.cos(p.aim) * 4 - Math.sin(p.aim) * side * 12;
			const py = p.y + Math.sin(p.aim) * 4 + Math.cos(p.aim) * side * 12;
			this.burst(px, py, 1, "rgba(232,234,239,0.55)", 40, true);
		}
	}
	stepYaw(p, dt) {
		const err = wrapAng(p.want - p.aim);
		const agile = p.speedMul * (p.speedT > 0 ? 1.12 : 1);
		const k = (this.reduced ? 780 : 220) * agile;
		const damp = 2 * (this.reduced ? 1.05 : .7) * Math.sqrt(k);
		const maxW = (this.reduced ? 28 : 16.8) * agile;
		p.omega += (k * err - damp * p.omega) * dt;
		p.omega = clamp(p.omega, -maxW, maxW);
		if (Math.abs(err) < .006 && Math.abs(p.omega) < .18) {
			p.omega = 0;
			p.aim = p.want;
			return;
		}
		p.aim = wrapAng(p.aim + p.omega * dt);
	}
	shootPlayer() {
		const p = this.player;
		p.fireCd = .155 / p.fireMul;
		const extra = p.extraShots + (p.multiT > 0 ? 2 : 0);
		const spread = extra === 0 ? [0] : extra === 2 ? [
			-.16,
			0,
			.16
		] : extra === 4 ? [
			-.28,
			-.12,
			0,
			.12,
			.28
		] : [
			-.22,
			0,
			.22
		];
		const nose = 20;
		const ox = p.x + Math.cos(p.aim) * nose;
		const oy = p.y + Math.sin(p.aim) * nose;
		let torque = 0;
		for (const off of spread) {
			this.fireBullet(ox, oy, p.aim + off, 620, true, 1 * p.dmgMul, 4.2, .85, p.pierce, p.homing);
			torque += off * 9;
		}
		p.omega += torque;
		p.vx -= Math.cos(p.aim) * 10;
		p.vy -= Math.sin(p.aim) * 10;
		this.muzzle(ox, oy, p.aim);
		sfx("shoot");
		this.trauma = Math.min(1, this.trauma + .045);
	}
	stepWorld(dt) {
		const p = this.player;
		for (const e of this.enemies) {
			if (!e.alive) continue;
			const spec = KIND[e.kind];
			const dx = p.x - e.x;
			const dy = p.y - e.y;
			const dist = Math.hypot(dx, dy) || 1;
			let tx = dx / dist;
			let ty = dy / dist;
			if (e.kind === "cruiser" && dist < 180) {
				tx = -ty;
				ty = dx / dist;
			}
			for (const o of this.enemies) {
				if (!o.alive || o === e) continue;
				const sx = e.x - o.x;
				const sy = e.y - o.y;
				const sd = Math.hypot(sx, sy);
				if (sd > 0 && sd < e.r + o.r + 10) {
					tx += sx / sd * .7;
					ty += sy / sd * .7;
				}
			}
			const tn = Math.hypot(tx, ty) || 1;
			const spd = spec.spd * (1 + this.wave * .03);
			e.vx = tx / tn * spd;
			e.vy = ty / tn * spd;
			if (e.knock > 0) {
				e.x += e.vx * dt * .2;
				e.y += e.vy * dt * .2;
				e.knock -= dt;
			} else {
				e.x += e.vx * dt;
				e.y += e.vy * dt;
			}
			e.aim = Math.atan2(dy, dx);
			if (e.flash > 0) e.flash -= dt;
			if (spec.fire > 0) {
				e.fireCd -= dt;
				if (e.fireCd <= 0 && dist < 560 && p.deadT <= 0) {
					e.fireCd = spec.fire * (e.kind === "cruiser" ? 1 : 1 + Math.random() * .2);
					const ang = e.aim;
					if (e.kind === "bomber") for (const off of [
						-.22,
						0,
						.22
					]) this.fireBullet(e.x, e.y, ang + off, 240, false, 1, 5, 2.4);
					else if (e.kind === "cruiser") {
						this.fireBullet(e.x, e.y, ang, 280, false, 1, 6, 2.6);
						this.fireBullet(e.x, e.y, ang + .18, 260, false, 1, 5, 2.4);
						this.fireBullet(e.x, e.y, ang - .18, 260, false, 1, 5, 2.4);
					} else this.fireBullet(e.x, e.y, ang, 270, false, 1, 4.5, 2.2);
				}
			}
		}
		for (const b of this.bullets) {
			if (!b.alive) continue;
			if (b.homing > 0 && b.friendly) {
				const t = this.nearestEnemy(b.x, b.y);
				if (t) {
					const desired = Math.atan2(t.y - b.y, t.x - b.x);
					const cur = Math.atan2(b.vy, b.vx);
					let diff = desired - cur;
					while (diff > Math.PI) diff -= Math.PI * 2;
					while (diff < -Math.PI) diff += Math.PI * 2;
					const turn = clamp(diff, -2.6 * dt, 2.6 * dt);
					const spd = Math.hypot(b.vx, b.vy);
					const na = cur + turn;
					b.vx = Math.cos(na) * spd;
					b.vy = Math.sin(na) * spd;
					b.rot = na;
				}
			} else b.rot = Math.atan2(b.vy, b.vx);
			b.x += b.vx * dt;
			b.y += b.vy * dt;
			b.ttl -= dt;
			if (b.ttl <= 0 || b.x < -40 || b.y < -40 || b.x > this.w + 40 || b.y > this.h + 40) b.alive = false;
		}
		for (const u of this.pickups) {
			if (!u.alive) continue;
			u.ttl -= dt;
			u.bob += dt * 4;
			const dx = p.x - u.x;
			const dy = p.y - u.y;
			const d = Math.hypot(dx, dy);
			if (d < p.magnet && d > 1) {
				u.x += dx / d * 220 * dt;
				u.y += dy / d * 220 * dt;
			}
			if (u.ttl <= 0) u.alive = false;
		}
		for (const q of this.parts) if (q.alive) this.stepPart(q, dt);
		for (const f of this.floaters) {
			if (!f.alive) continue;
			f.y += f.vy * dt;
			f.life -= dt;
			if (f.life <= 0) f.alive = false;
		}
		for (const m of this.muzzles) {
			if (!m.alive) continue;
			m.life -= dt;
			if (m.life <= 0) m.alive = false;
		}
	}
	stepPart(q, dt) {
		q.x += q.vx * dt;
		q.y += q.vy * dt;
		const drag = Math.exp(-q.drag * dt);
		q.vx *= drag;
		q.vy *= drag;
		q.life -= dt;
		if (q.life <= 0) q.alive = false;
	}
	collisions() {
		const p = this.player;
		for (const b of this.bullets) {
			if (!b.alive) continue;
			if (b.friendly) for (const e of this.enemies) {
				if (!e.alive) continue;
				const dx = b.x - e.x;
				const dy = b.y - e.y;
				if (dx * dx + dy * dy < (b.r + e.r) * (b.r + e.r)) {
					this.hurtEnemy(e, b.dmg, Math.atan2(b.vy, b.vx));
					b.pierce -= 1;
					if (b.pierce < 0) {
						b.alive = false;
						break;
					}
				}
			}
			else if (p.deadT <= 0 && p.invuln <= 0) {
				const dx = b.x - p.x;
				const dy = b.y - p.y;
				if (dx * dx + dy * dy < (b.r + p.radius) * (b.r + p.radius)) {
					b.alive = false;
					this.hurtPlayer(1);
				}
			}
		}
		if (p.deadT <= 0) {
			for (const e of this.enemies) {
				if (!e.alive) continue;
				const dx = e.x - p.x;
				const dy = e.y - p.y;
				if (dx * dx + dy * dy < (e.r + p.radius) * (e.r + p.radius)) {
					if (p.invuln <= 0) this.hurtPlayer(1);
					const n = Math.hypot(dx, dy) || 1;
					e.x += dx / n * 8;
					e.y += dy / n * 8;
				}
			}
			for (const u of this.pickups) {
				if (!u.alive) continue;
				const dx = u.x - p.x;
				const dy = u.y - p.y;
				if (dx * dx + dy * dy < (18 + p.radius) * (18 + p.radius)) {
					u.alive = false;
					this.takePickup(u.kind);
				}
			}
		}
	}
	takePickup(kind) {
		const p = this.player;
		sfx("pickup");
		if (kind === "multi") {
			p.multiT = 8;
			this.float(p.x, p.y, "TRI-FIRE", "#8eb8c8");
		} else if (kind === "speed") {
			p.speedT = 8;
			this.float(p.x, p.y, "SLIPSTREAM", "#e8eaef");
		} else if (kind === "shield") {
			const cap = Math.max(p.maxShield, 3);
			p.maxShield = cap;
			p.shield = cap;
			this.float(p.x, p.y, "AEGIS", "#7dba9a");
		} else {
			p.hp = Math.min(p.maxHp, p.hp + 2);
			this.float(p.x, p.y, "REPAIR", "#7dba9a");
		}
	}
	hurtEnemy(e, dmg, ang) {
		e.hp -= dmg;
		e.flash = .06;
		e.knock = .05;
		e.x += Math.cos(ang) * 6;
		e.y += Math.sin(ang) * 6;
		this.burst(e.x, e.y, 4, "#e8eaef", 140);
		sfx("hit");
		if (e.hp <= 0) this.killEnemy(e);
	}
	killEnemy(e) {
		e.alive = false;
		this.combo = Math.min(8, this.combo + 1);
		this.comboT = 1.25;
		const pts = e.value * this.combo;
		this.score += pts;
		this.float(e.x, e.y, `+${pts}`, "#e8eaef");
		this.burst(e.x, e.y, e.kind === "cruiser" ? 36 : 16, e.kind === "cruiser" ? "#c56b6b" : "#d48a6a", 260);
		this.trauma = Math.min(1, this.trauma + (e.kind === "cruiser" ? .55 : .18));
		this.hitstop = e.kind === "cruiser" ? .07 : .028;
		sfx("explode");
		this.input.rumble(e.kind === "cruiser" ? .7 : .25, .5, e.kind === "cruiser" ? 140 : 40);
		const drop = e.kind === "cruiser" ? 1 : e.kind === "bomber" ? .28 : .12;
		if (Math.random() < drop) this.spawnPickup(e.x, e.y);
		if (e.kind === "cruiser") {
			this.spawnPickup(e.x + 16, e.y, "shield");
			this.forge += 1;
		}
	}
	hurtPlayer(n) {
		const p = this.player;
		if (p.invuln > 0 || p.deadT > 0) return;
		if (p.shield > 0) {
			p.shield = Math.max(0, p.shield - n);
			p.invuln = .35;
			this.burst(p.x, p.y, 10, "#7dba9a", 180);
			sfx("hit");
			this.trauma = Math.min(1, this.trauma + .25);
			this.input.rumble(.2, .45, 50);
			return;
		}
		p.hp -= n;
		p.invuln = .7;
		this.trauma = Math.min(1, this.trauma + .45);
		this.hitstop = .055;
		sfx("hurt");
		this.input.rumble(.55, .8, 120);
		this.burst(p.x, p.y, 14, "#c56b6b", 200);
		if (p.hp <= 0) {
			p.lives -= 1;
			p.deadT = 1.15;
			p.hp = 0;
			this.burst(p.x, p.y, 28, "#8eb8c8", 280);
			sfx("explode");
		}
	}
	waveLogic(dt) {
		if (!this.inWave) {
			this.waveWait -= dt;
			if (this.waveWait <= 0) this.nextWave();
			return;
		}
		let live = 0;
		for (const e of this.enemies) if (e.alive) live++;
		if (live === 0) {
			this.inWave = false;
			this.waveWait = 2.05;
			this.forge += 1;
			this.score += this.wave * 500;
			this.banner = "Wave cleared · Forge +1";
			this.bannerT = 2;
			this.float(this.player.x, this.player.y - 30, "FORGE +1", "#8eb8c8");
			sfx("wave");
		}
	}
	gameOver() {
		sfx("over");
		const q = qualifies(this.score);
		useGame.getState().setQualify(q, this.score, this.wave);
		useGame.getState().setScores(getScores());
		this.setPhase("gameover");
	}
	nearestEnemy(x, y) {
		let best = null;
		let bd = Infinity;
		for (const e of this.enemies) {
			if (!e.alive) continue;
			const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
			if (d < bd) {
				bd = d;
				best = e;
			}
		}
		return best;
	}
	driftStars(dt, vx, vy) {
		for (const s of this.stars) {
			s.x -= vx * s.z * .22 * dt + s.z * 14 * dt;
			s.y -= vy * s.z * .22 * dt;
			if (s.x < 0) s.x += this.w;
			if (s.x > this.w) s.x -= this.w;
			if (s.y < 0) s.y += this.h;
			if (s.y > this.h) s.y -= this.h;
		}
	}
	publishHud() {
		const p = this.player;
		const snap = {
			score: this.score,
			lives: Math.max(0, p.lives),
			hp: Math.max(0, p.hp),
			maxHp: p.maxHp,
			shield: p.shield,
			maxShield: p.maxShield,
			wave: this.wave,
			forge: this.forge,
			combo: this.combo,
			multiT: p.multiT,
			speedT: p.speedT,
			banner: this.bannerT > 0 ? this.banner : "",
			dashCd: p.dashCd,
			unspent: this.forge,
			padOn: this.padOn || this.input.padLive
		};
		useGame.getState().setHud(snap);
	}
	draw() {
		const ctx = this.ctx;
		const w = this.w;
		const h = this.h;
		ctx.setTransform((window.devicePixelRatio || 1) > 0 ? Math.min(window.devicePixelRatio || 1, 2) : 1, 0, 0, Math.min(window.devicePixelRatio || 1, 2), 0, 0);
		let sx = 0;
		let sy = 0;
		if (this.shakeOn && !this.reduced && this.trauma > 0) {
			const mag = this.trauma * this.trauma * 11;
			sx = Math.sin(this.t * 73.1) * mag;
			sy = Math.cos(this.t * 61.7) * mag;
		}
		ctx.save();
		ctx.translate(sx, sy);
		ctx.fillStyle = "#08090d";
		ctx.fillRect(-20, -20, w + 40, h + 40);
		for (const s of this.stars) {
			const a = .25 + s.z * .55;
			ctx.fillStyle = s.z > .8 ? `rgba(232,234,239,${a})` : `rgba(142,184,200,${a})`;
			ctx.fillRect(s.x, s.y, s.s, s.s);
		}
		for (const q of this.parts) {
			if (!q.alive) continue;
			ctx.globalAlpha = Math.max(0, q.life / q.max);
			ctx.fillStyle = q.color;
			if (q.additive) ctx.globalCompositeOperation = "lighter";
			ctx.fillRect(q.x, q.y, q.size, q.size);
			ctx.globalCompositeOperation = "source-over";
			ctx.globalAlpha = 1;
		}
		for (const u of this.pickups) {
			if (!u.alive) continue;
			const bob = Math.sin(u.bob) * 3;
			if (this.atlas?.powerups) drawFrame(ctx, this.atlas.powerups, PICK_FRAME[u.kind], u.x, u.y + bob, 28, 28);
			else {
				ctx.fillStyle = "#8eb8c8";
				ctx.beginPath();
				ctx.arc(u.x, u.y + bob, 8, 0, Math.PI * 2);
				ctx.fill();
			}
		}
		for (const b of this.bullets) {
			if (!b.alive) continue;
			const sheet = b.friendly ? this.atlas?.boltPlayer : this.atlas?.boltEnemy;
			const frame = (this.t * 12 | 0) % 4;
			if (sheet) drawFrame(ctx, sheet, frame, b.x, b.y, b.friendly ? 18 : 16, b.friendly ? 28 : 22, b.rot + Math.PI / 2);
			else {
				ctx.save();
				ctx.translate(b.x, b.y);
				ctx.rotate(b.rot);
				ctx.fillStyle = b.friendly ? "#8eb8c8" : "#c56b6b";
				ctx.fillRect(-2, -7, 4, 14);
				ctx.restore();
			}
		}
		for (const e of this.enemies) {
			if (!e.alive) continue;
			const spec = KIND[e.kind];
			const size = spec.r * 2.6;
			ctx.save();
			if (e.flash > 0) ctx.globalCompositeOperation = "lighter";
			if (this.atlas?.enemies) drawFrame(ctx, this.atlas.enemies, spec.frame, e.x, e.y, size, size, e.aim + Math.PI / 2, e.flash > 0 ? 1 : 1);
			else this.drawPoly(ctx, e.x, e.y, e.aim, spec.r, "#c56b6b");
			ctx.restore();
			if (e.kind === "cruiser" || e.hp < e.maxHp) {
				const bw = spec.r * 2;
				ctx.fillStyle = "rgba(8,9,13,0.6)";
				ctx.fillRect(e.x - bw / 2, e.y - spec.r - 8, bw, 3);
				ctx.fillStyle = "#c56b6b";
				ctx.fillRect(e.x - bw / 2, e.y - spec.r - 8, bw * clamp(e.hp / e.maxHp, 0, 1), 3);
			}
		}
		const p = this.player;
		if (p.deadT <= 0 && this.phase !== "title") {
			if (p.maxShield > 0 && p.shield > 0) {
				ctx.strokeStyle = `rgba(125,186,154,${.35 + .25 * Math.sin(this.t * 6)})`;
				ctx.lineWidth = 2;
				ctx.beginPath();
				ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2);
				ctx.stroke();
			}
			const blink = p.invuln > 0 && Math.sin(this.t * 28) < 0 ? .35 : 1;
			const bank = clamp(p.omega * .038, -.38, .38);
			const squash = 1 + Math.min(.14, Math.abs(p.omega) * .01);
			const drawRot = p.aim + Math.PI / 2 + bank;
			if (this.atlas?.player) drawFrame(ctx, this.atlas.player, 0, p.x, p.y, 46, 46, drawRot, blink, squash, 1 / squash);
			else {
				ctx.globalAlpha = blink;
				this.drawPoly(ctx, p.x, p.y, p.aim + bank, 16, "#8eb8c8", squash);
				ctx.globalAlpha = 1;
			}
			const hc = Math.cos(p.aim);
			const hs = Math.sin(p.aim);
			const wc = Math.cos(p.want);
			const ws = Math.sin(p.want);
			ctx.save();
			ctx.strokeStyle = "rgba(142,184,200,0.28)";
			ctx.lineWidth = 1.25;
			ctx.setLineDash([5, 7]);
			ctx.beginPath();
			ctx.moveTo(p.x + wc * 22, p.y + ws * 22);
			if (this.aimVis.showPointer) ctx.lineTo(this.aimVis.px, this.aimVis.py);
			else ctx.lineTo(p.x + wc * 110, p.y + ws * 110);
			ctx.stroke();
			ctx.setLineDash([]);
			ctx.restore();
			ctx.strokeStyle = "rgba(142,184,200,0.78)";
			ctx.lineWidth = 1.85;
			ctx.beginPath();
			ctx.moveTo(p.x + hc * 18, p.y + hs * 18);
			ctx.lineTo(p.x + hc * 36, p.y + hs * 36);
			ctx.stroke();
			if (this.aimVis.showPointer) {
				const x = this.aimVis.px;
				const y = this.aimVis.py;
				ctx.strokeStyle = "rgba(232,234,239,0.62)";
				ctx.lineWidth = 1.25;
				ctx.beginPath();
				ctx.arc(x, y, 9, 0, Math.PI * 2);
				ctx.moveTo(x - 13, y);
				ctx.lineTo(x - 4, y);
				ctx.moveTo(x + 4, y);
				ctx.lineTo(x + 13, y);
				ctx.moveTo(x, y - 13);
				ctx.lineTo(x, y - 4);
				ctx.moveTo(x, y + 4);
				ctx.lineTo(x, y + 13);
				ctx.stroke();
			}
		}
		for (const m of this.muzzles) {
			if (!m.alive) continue;
			const f = Math.min(3, Math.floor((1 - m.life / m.max) * 4));
			if (this.atlas?.muzzle) {
				ctx.globalCompositeOperation = "lighter";
				drawFrame(ctx, this.atlas.muzzle, f, m.x, m.y, 28, 36, m.rot + Math.PI / 2, m.life / m.max);
				ctx.globalCompositeOperation = "source-over";
			}
		}
		ctx.font = "600 13px Oxanium, sans-serif";
		ctx.textAlign = "center";
		for (const f of this.floaters) {
			if (!f.alive) continue;
			ctx.globalAlpha = clamp(f.life / .4, 0, 1);
			ctx.fillStyle = f.color;
			ctx.fillText(f.text, f.x, f.y);
			ctx.globalAlpha = 1;
		}
		ctx.restore();
	}
	drawPoly(ctx, x, y, aim, r, color, squash = 1) {
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(aim + Math.PI / 2);
		ctx.scale(squash, 1 / squash);
		ctx.fillStyle = color;
		ctx.beginPath();
		ctx.moveTo(0, -r);
		ctx.lineTo(r * .72, r * .7);
		ctx.lineTo(0, r * .28);
		ctx.lineTo(-r * .72, r * .7);
		ctx.closePath();
		ctx.fill();
		ctx.restore();
	}
};
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap font-display text-sm font-medium tracking-wide transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 disabled:pointer-events-none disabled:opacity-40 active:scale-[0.98]", {
	variants: {
		variant: {
			primary: "bg-accent text-accent-fg hover:bg-fg",
			ghost: "bg-transparent text-fg hover:bg-elevated border border-border",
			danger: "bg-danger text-fg hover:opacity-90"
		},
		size: {
			md: "h-11 px-5 rounded-[12px]",
			lg: "h-12 px-6 rounded-[14px] text-base",
			sm: "h-9 px-3 rounded-[8px] text-xs"
		}
	},
	defaultVariants: {
		variant: "primary",
		size: "md"
	}
});
function Button({ className, variant, size, asChild, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
function Panel({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("pointer-events-auto w-[min(440px,calc(100vw-2rem))] rounded-xl border border-border bg-surface/92 p-6 text-fg shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm", className),
		children
	});
}
function Overlay({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "absolute inset-0 z-20 flex items-center justify-center bg-bg/70 p-4 backdrop-blur-[2px]",
		children
	});
}
function TitleScreen() {
	const api = useGame((s) => s.api);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		className: "text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xs font-medium uppercase tracking-[0.28em] text-accent",
				children: "Deep void protocol"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-fg sm:text-5xl",
				children: "Aetherwake"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted",
				children: "Twin-stick void combat. WASD strafes, mouse aims. The hull yaws onto the reticle — shots leave the nose."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "lg",
					className: "w-full",
					disabled: !api,
					onClick: () => api?.start(),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), "Engage"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => api?.toHelp(),
						children: "Briefing"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => api?.toScores(),
						children: "Records"
					})]
				})]
			})
		]
	}) });
}
function HelpScreen() {
	const api = useGame((s) => s.api);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-xl font-semibold",
			children: "Briefing"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
			className: "mt-4 space-y-2 text-sm leading-relaxed text-muted",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-fg",
					children: "Move"
				}), " with WASD or the left stick. Facing is not tied to thrust — strafe one way, fire another."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-fg",
					children: "Aim"
				}), " with the mouse or right stick. The hull has yaw mass — it slews onto the reticle instead of snapping. Shots leave the nose, so lead hard flicks. Auto-fire stays on."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-fg",
					children: "Controller"
				}), " — left stick move, right stick aim, Start/Select pause, A to engage from the title, bumpers dash (if unlocked)."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-fg",
					children: "Touch"
				}), " — drag on the left half to move, right half to aim. Sticks appear under your thumbs."] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Pickups: multi-shot, shield, speed, repair. Clear waves to earn Forge and open the skill map." })
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			className: "mt-6 w-full",
			variant: "ghost",
			onClick: () => api?.toTitle(),
			children: "Close"
		})
	] }) });
}
function PauseMenu() {
	const api = useGame((s) => s.api);
	const settings = useGame((s) => s.settings);
	const hud = useGame((s) => s.hud);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		className: "text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xs uppercase tracking-[0.24em] text-muted",
				children: "Systems held"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-3xl font-semibold",
				children: "Paused"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "mt-2 font-mono text-sm text-muted",
				children: [
					"Wave ",
					hud.wave,
					" · ",
					hud.score.toLocaleString()
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						onClick: () => api?.resume(),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-4" }), "Resume"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						onClick: () => api?.openSkills(),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "size-4" }),
							"Forge map",
							hud.unspent > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg",
								children: hud.unspent
							}) : null
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						onClick: () => api?.setSettings({ mute: !settings.mute }),
						children: [settings.mute ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VolumeX, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Volume2, { className: "size-4" }), settings.mute ? "Sound off" : "Sound on"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						onClick: () => api?.setSettings({ shake: !settings.shake }),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-4" }),
							"Shake ",
							settings.shake ? "on" : "off"
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => api?.toTitle(),
						children: "Abandon run"
					})
				]
			})
		]
	}) });
}
function GameOver() {
	const api = useGame((s) => s.api);
	const qualify = useGame((s) => s.qualify);
	const score = useGame((s) => s.lastScore);
	const wave = useGame((s) => s.lastWave);
	const [name, setName] = (0, import_react.useState)("Pilot");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, {
		className: "text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-display text-xs uppercase tracking-[0.24em] text-danger",
				children: "Signal lost"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "mt-1 font-display text-3xl font-semibold",
				children: "Wake collapsed"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-3 font-mono text-lg tabular-nums text-fg",
				children: score.toLocaleString()
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted",
				children: ["Wave ", wave]
			}),
			qualify ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
				className: "mt-5 space-y-3",
				onSubmit: (e) => {
					e.preventDefault();
					api?.submitName(name);
				},
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
					className: "block text-left text-xs uppercase tracking-wider text-muted",
					children: ["Callsign", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: name,
						onChange: (e) => setName(e.target.value),
						maxLength: 12,
						className: "mt-1 h-11 w-full rounded-[12px] border border-border bg-elevated px-3 font-display text-fg outline-none focus:ring-2 focus:ring-accent/70"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					type: "submit",
					className: "w-full",
					children: "Save record"
				})]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 flex flex-col gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						onClick: () => api?.start(),
						children: "Again"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => api?.toScores(),
						children: "Records"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "ghost",
						onClick: () => api?.toTitle(),
						children: "Title"
					})
				]
			})
		]
	}) });
}
function HighScores() {
	const api = useGame((s) => s.api);
	const scores = useGame((s) => s.scores);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Panel, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "font-display text-xl font-semibold",
			children: "Records"
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
			className: "mt-4 space-y-2",
			children: scores.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
				className: "text-sm text-muted",
				children: "No wakes logged yet."
			}) : scores.map((s, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
				className: "flex items-baseline justify-between gap-3 border-b border-border py-2 font-mono text-sm tabular-nums",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted",
						children: String(i + 1).padStart(2, "0")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "flex-1 font-display text-fg",
						children: s.name
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-muted",
						children: ["W", s.wave]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-fg",
						children: s.score.toLocaleString()
					})
				]
			}, `${s.at}-${i}`))
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
			className: "mt-6 w-full",
			variant: "ghost",
			onClick: () => api?.toTitle(),
			children: "Close"
		})
	] }) });
}
function SkillMap() {
	const api = useGame((s) => s.api);
	const owned = new Set(useGame((s) => s.owned));
	const forge = useGame((s) => s.hud.forge);
	const [sel, setSel] = (0, import_react.useState)("core");
	const def = SKILL_BY_ID[sel];
	const canBuy = isAvailable(sel, owned) && forge >= def.cost && def.cost > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Overlay, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-auto flex h-[min(720px,calc(100dvh-2rem))] w-[min(980px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface/94 shadow-[0_24px_80px_rgba(0,0,0,0.5)]",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "font-display text-xs uppercase tracking-[0.22em] text-accent",
					children: "Constellation"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-lg font-semibold",
					children: "Forge map"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-mono text-sm tabular-nums text-fg",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted",
							children: "Forge "
						}), forge]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						"aria-label": "Close forge map",
						className: "grid size-11 place-items-center rounded-[12px] border border-border text-fg hover:bg-elevated",
						onClick: () => api?.closeSkills(),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "relative min-h-0 flex-1 overflow-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
					viewBox: "0 0 1000 720",
					className: "h-auto w-full min-w-[640px] min-h-[460px]",
					children: [SKILL_EDGES.map(([a, b]) => {
						const na = SKILL_BY_ID[a];
						const nb = SKILL_BY_ID[b];
						const on = owned.has(a) && owned.has(b);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("line", {
							x1: na.x * 1e3,
							y1: na.y * 720,
							x2: nb.x * 1e3,
							y2: nb.y * 720,
							stroke: on ? "#8eb8c8" : "rgba(232,234,239,0.14)",
							strokeWidth: on ? 2.4 : 1.2
						}, `${a}-${b}`);
					}), SKILLS.map((s) => {
						const isOwned = owned.has(s.id);
						const isAvail = isAvailable(s.id, owned) || s.id === "core";
						const selected = sel === s.id;
						const cx = s.x * 1e3;
						const cy = s.y * 720;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("g", {
							transform: `translate(${cx} ${cy})`,
							className: "cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
								r: selected ? 28 : 24,
								fill: isOwned ? "#8eb8c8" : isAvail ? "#1a1d27" : "#12141c",
								stroke: selected ? "#e8eaef" : isAvail ? "#8eb8c8" : "rgba(232,234,239,0.2)",
								strokeWidth: selected ? 2.5 : 1.4,
								onClick: () => setSel(s.id)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("text", {
								textAnchor: "middle",
								y: 5,
								fill: isOwned ? "#08090d" : isAvail ? "#e8eaef" : "#5c6170",
								fontSize: "11",
								fontFamily: "Oxanium, sans-serif",
								fontWeight: "600",
								pointerEvents: "none",
								children: s.id === "core" ? "CORE" : s.cost
							})]
						}, s.id);
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", {
				className: "flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-display text-base font-semibold",
						children: def.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted",
						children: def.desc
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					disabled: !canBuy,
					onClick: () => {
						api?.buySkill(sel);
					},
					children: owned.has(sel) ? "Online" : canBuy ? `Forge · ${def.cost}` : def.cost === 0 ? "Core" : "Locked"
				})]
			})
		]
	}) });
}
function Hud() {
	const phase = useGame((s) => s.phase);
	const hud = useGame((s) => s.hud);
	const api = useGame((s) => s.api);
	if (phase === "title" || phase === "help" || phase === "scores") return null;
	if (!(phase === "playing" || phase === "paused" || phase === "skills" || phase === "gameover")) return null;
	const hpPct = hud.maxHp ? hud.hp / hud.maxHp * 100 : 0;
	const shPct = hud.maxShield ? hud.shield / hud.maxShield * 100 : 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none absolute inset-0 z-10 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[16px] border border-border bg-bg/55 px-3 py-2 backdrop-blur-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted",
							children: "Score"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-mono text-xl tabular-nums text-fg",
							children: hud.score.toLocaleString()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-elevated",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-danger",
								style: { width: `${hpPct}%` }
							})
						}),
						hud.maxShield > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1 h-1 w-36 overflow-hidden rounded-full bg-elevated",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "h-full bg-ok",
								style: { width: `${shPct}%` }
							})
						}) : null,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-2 flex gap-1",
							children: Array.from({ length: 3 }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("block h-2 w-2 rotate-45", i < hud.lives ? "bg-accent" : "bg-elevated") }, i))
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col items-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "rounded-[16px] border border-border bg-bg/55 px-3 py-2 font-mono text-sm tabular-nums text-fg backdrop-blur-sm",
						children: [
							"W",
							hud.wave,
							hud.combo > 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-2 text-accent",
								children: ["x", hud.combo]
							}) : null,
							hud.padOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "ml-2 inline-flex items-center gap-1 text-[11px] text-accent",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gamepad2, { className: "size-3" }), "PAD"]
							}) : null
						]
					}), phase === "playing" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pointer-events-auto flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "grid size-11 place-items-center rounded-[12px] border border-border bg-surface/80 text-fg",
							onClick: () => api?.openSkills(),
							"aria-label": "Open forge map",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Map, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "grid size-11 place-items-center rounded-[12px] border border-border bg-surface/80 text-fg",
							onClick: () => api?.pause(),
							"aria-label": "Pause",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-4" })
						})]
					}) : null]
				})]
			}),
			hud.banner ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none mt-6 text-center font-display text-sm uppercase tracking-[0.22em] text-fg",
				children: hud.banner
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "absolute bottom-[max(9rem,env(safe-area-inset-bottom))] right-3 flex flex-col items-end gap-1 sm:bottom-5 sm:right-5",
				children: [
					hud.multiT > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 rounded-full border border-border bg-bg/60 px-2 py-1 font-mono text-[11px] text-accent",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Zap, { className: "size-3" }),
							" ",
							hud.multiT.toFixed(0),
							"s"
						]
					}) : null,
					hud.speedT > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 rounded-full border border-border bg-bg/60 px-2 py-1 font-mono text-[11px] text-fg",
						children: [
							"SPD ",
							hud.speedT.toFixed(0),
							"s"
						]
					}) : null,
					hud.maxShield > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "flex items-center gap-1 rounded-full border border-border bg-bg/60 px-2 py-1 font-mono text-[11px] text-ok",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "size-3" }),
							" ",
							hud.shield
						]
					}) : null
				]
			})
		]
	});
}
function DualSticks() {
	const layerRef = (0, import_react.useRef)(null);
	const moveRef = (0, import_react.useRef)(null);
	const aimRef = (0, import_react.useRef)(null);
	const [moveKnob, setMoveKnob] = (0, import_react.useState)(null);
	const [aimKnob, setAimKnob] = (0, import_react.useState)(null);
	const R = 56;
	const vec = (ox, oy, cx, cy) => {
		let x = cx - ox;
		let y = cy - oy;
		const m = Math.hypot(x, y);
		if (m > R) {
			x = x / m * R;
			y = y / m * R;
		}
		return {
			x,
			y
		};
	};
	const sideFor = (clientX) => {
		const el = layerRef.current;
		if (!el) return "left";
		const rect = el.getBoundingClientRect();
		return clientX < rect.left + rect.width / 2 ? "left" : "right";
	};
	const release = (id) => {
		if (moveRef.current?.id === id) {
			moveRef.current = null;
			setMoveKnob(null);
			gameInput?.setTouchMove(0, 0, false);
		}
		if (aimRef.current?.id === id) {
			aimRef.current = null;
			setAimKnob(null);
			gameInput?.setTouchAim(0, 0, false);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		ref: layerRef,
		className: "pointer-events-auto absolute inset-x-0 bottom-0 top-[36%] z-20 touch-none",
		onPointerDown: (e) => {
			if (e.pointerType === "mouse") return;
			const side = sideFor(e.clientX);
			const slot = side === "left" ? moveRef : aimRef;
			if (slot.current) return;
			e.currentTarget.setPointerCapture(e.pointerId);
			slot.current = {
				id: e.pointerId,
				ox: e.clientX,
				oy: e.clientY
			};
			const k = vec(e.clientX, e.clientY, e.clientX, e.clientY);
			if (side === "left") {
				setMoveKnob({
					ox: e.clientX,
					oy: e.clientY,
					x: k.x,
					y: k.y
				});
				gameInput?.setTouchMove(0, 0, true);
			} else {
				setAimKnob({
					ox: e.clientX,
					oy: e.clientY,
					x: k.x,
					y: k.y
				});
				gameInput?.setTouchAim(0, 0, true);
			}
		},
		onPointerMove: (e) => {
			const apply = (slot, set, send) => {
				if (slot.id !== e.pointerId) return;
				const k = vec(slot.ox, slot.oy, e.clientX, e.clientY);
				set({
					ox: slot.ox,
					oy: slot.oy,
					x: k.x,
					y: k.y
				});
				send(k.x / R, k.y / R, true);
			};
			if (moveRef.current) apply(moveRef.current, setMoveKnob, (x, y, on) => gameInput?.setTouchMove(x, y, on));
			if (aimRef.current) apply(aimRef.current, setAimKnob, (x, y, on) => gameInput?.setTouchAim(x, y, on));
		},
		onPointerUp: (e) => release(e.pointerId),
		onPointerCancel: (e) => release(e.pointerId),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-6 font-display text-[10px] uppercase tracking-[0.2em] text-muted",
				children: "Move"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-6 font-display text-[10px] uppercase tracking-[0.2em] text-muted",
				children: "Aim"
			}),
			moveKnob ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StickGhost, {
				knob: moveKnob,
				r: R
			}) : null,
			aimKnob ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StickGhost, {
				knob: aimKnob,
				r: R
			}) : null
		]
	});
}
function StickGhost({ knob, r }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "pointer-events-none fixed z-20 size-32 -translate-x-1/2 -translate-y-1/2",
		style: {
			left: knob.ox,
			top: knob.oy,
			width: r * 2,
			height: r * 2
		},
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 rounded-full border border-border bg-surface/45" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute left-1/2 top-1/2 size-11 rounded-full border border-border-strong bg-elevated",
			style: { transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }
		})]
	});
}
function TouchControls() {
	const playing = useGame((s) => s.phase) === "playing";
	(0, import_react.useEffect)(() => {
		if (!playing) {
			gameInput?.setTouchMove(0, 0, false);
			gameInput?.setTouchAim(0, 0, false);
		}
	}, [playing]);
	if (!playing) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "pointer-events-none absolute inset-0 z-20 [@media(hover:hover)_and_(pointer:fine)]:hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DualSticks, {})
	});
}
function GameView() {
	const canvasRef = (0, import_react.useRef)(null);
	const phase = useGame((s) => s.phase);
	(0, import_react.useEffect)(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const game = new Game(canvas);
		game.startLoop();
		return () => game.destroy();
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "relative h-dvh w-full overflow-hidden bg-bg text-fg",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("canvas", {
				ref: canvasRef,
				className: "block h-full w-full touch-none select-none",
				style: { touchAction: "none" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Hud, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TouchControls, {}),
			phase === "title" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TitleScreen, {}) : null,
			phase === "help" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HelpScreen, {}) : null,
			phase === "paused" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PauseMenu, {}) : null,
			phase === "skills" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SkillMap, {}) : null,
			phase === "gameover" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameOver, {}) : null,
			phase === "scores" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HighScores, {}) : null
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GameView, {});
}
//#endregion
export { Home as component };
