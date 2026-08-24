import { sfx, unlockAudio, setMuted, resumeAudio } from "./audio";
import { Input, type InputState } from "./input";
import { applyOwnedToPlayer, isAvailable, SKILL_BY_ID, type SkillDef } from "./skills";
import { loadAtlas, drawFrame, type Atlas } from "./sprites";
import { useGame } from "./store";
import { getScores, qualifies, saveSettings, submitScore } from "./save";
import type {
  Bullet,
  Enemy,
  EnemyKind,
  Floater,
  HudSnap,
  Muzzle,
  Particle,
  Phase,
  Pickup,
  PickupKind,
  Player,
  SkillId,
  Star,
} from "./types";

const STEP = 1 / 60;
const MAX_DT = 0.1;
const PAD = 28;
const ENEMY_CAP = 72;
const BULLET_CAP = 220;
const PART_CAP = 420;

const KIND: Record<EnemyKind, { hp: number; spd: number; r: number; value: number; fire: number; frame: number }> = {
  scout: { hp: 2, spd: 155, r: 14, value: 100, fire: 0, frame: 0 },
  fighter: { hp: 5, spd: 100, r: 18, value: 250, fire: 1.55, frame: 1 },
  bomber: { hp: 11, spd: 72, r: 22, value: 420, fire: 2.1, frame: 2 },
  cruiser: { hp: 48, spd: 46, r: 36, value: 1600, fire: 1.05, frame: 3 },
};

const PICK_FRAME: Record<PickupKind, number> = { multi: 0, shield: 1, speed: 2, repair: 3 };

function pool<T>(n: number, make: () => T): T[] {
  return Array.from({ length: n }, make);
}

function clamp(v: number, a: number, b: number) {
  return v < a ? a : v > b ? b : v;
}

function rand(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function pick<T>(arr: T[]): T {
  return arr[(Math.random() * arr.length) | 0]!;
}

function wrapAng(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  input = new Input();
  atlas: Atlas | null = null;
  private raf = 0;
  private acc = 0;
  private last = 0;
  private hudT = 0;
  w = 800;
  h = 600;
  phase: Phase = "title";
  player!: Player;
  enemies = pool(ENEMY_CAP, (): Enemy => ({
    alive: false, kind: "scout", x: 0, y: 0, vx: 0, vy: 0, hp: 0, maxHp: 1, r: 12, value: 0, fireCd: 0, flash: 0, knock: 0, aim: 0,
  }));
  bullets = pool(BULLET_CAP, (): Bullet => ({
    alive: false, friendly: true, x: 0, y: 0, vx: 0, vy: 0, r: 4, dmg: 1, ttl: 0, pierce: 0, homing: 0, rot: 0,
  }));
  pickups = pool(24, (): Pickup => ({ alive: false, kind: "multi", x: 0, y: 0, ttl: 0, bob: 0 }));
  parts = pool(PART_CAP, (): Particle => ({
    alive: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, max: 1, size: 2, color: "#fff", drag: 1, additive: false,
  }));
  floaters = pool(40, (): Floater => ({ alive: false, x: 0, y: 0, vy: 0, text: "", life: 0, color: "#fff" }));
  muzzles = pool(16, (): Muzzle => ({ alive: false, x: 0, y: 0, rot: 0, life: 0, max: 0.08 }));
  stars: Star[] = [];
  owned = new Set<SkillId>(["core"]);
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
  private fromPause = false;
  private aimVis = { showPointer: false, px: 0, py: 0 };
  private padOn = false;
  private apiHandle: ReturnType<typeof useGame.getState>["api"] = null;
  private ro: ResizeObserver | null = null;
  private vis = () => {
    resumeAudio();
    if (document.hidden && this.phase === "playing") this.setPhase("paused");
  };

  constructor(canvas: HTMLCanvasElement) {
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
    void loadAtlas().then((a) => {
      this.atlas = a;
    });
    this.publishHud();
    this.bindApi();
    this.setPhase("title");
    this.bindControlsTest();
  }

  startLoop() {
    this.last = performance.now();
    const tick = (now: number) => {
      this.raf = requestAnimationFrame(tick);
      let dt = (now - this.last) / 1000;
      this.last = now;
      if (dt > MAX_DT) dt = MAX_DT;
      this.acc += dt;
      const frozen =
        this.phase === "title" ||
        this.phase === "paused" ||
        this.phase === "skills" ||
        this.phase === "scores" ||
        this.phase === "help" ||
        this.phase === "gameover";
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
      if (this.hudT > 0.08) {
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
    if (typeof window !== "undefined" && window.__controlsTest === this.controlsProbe) {
      delete window.__controlsTest;
    }
  }

  private bindApi() {
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
        const cur = { ...useGame.getState().settings, ...s };
        saveSettings(cur);
        useGame.getState().setSettings(cur);
        setMuted(cur.mute);
        this.shakeOn = cur.shake;
      },
      owned: () => this.owned,
      forge: () => this.forge,
    };
    useGame.getState().setApi(this.apiHandle);
  }

  private controlsProbe = {
    getYaw: () => this.player.aim,
    getWant: () => this.player.want,
    getOmega: () => this.player.omega,
    getSpeed: () => Math.hypot(this.player.vx, this.player.vy),
    getX: () => this.player.x,
    getY: () => this.player.y,
    setKeys: (codes: string[]) => this.input.setKeys(codes),
    setSteer: (v: number) => {
      if (v > 0.2) this.input.setKeys(["KeyA"]);
      else if (v < -0.2) this.input.setKeys(["KeyD"]);
      else this.input.setKeys([]);
    },
  };

  private bindControlsTest() {
    if (typeof window === "undefined") return;
    window.__controlsTest = this.controlsProbe;
  }

  private setPhase(phase: Phase) {
    this.phase = phase;
    useGame.getState().setPhase(phase);
  }

  private startRun() {
    unlockAudio();
    sfx("wave");
    this.owned = new Set(["core"]);
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

  private submitName(name: string) {
    const clean = name.trim().slice(0, 12) || "Pilot";
    const scores = submitScore({ name: clean, score: this.score, wave: this.wave, at: Date.now() });
    useGame.getState().setScores(scores);
    this.setPhase("scores");
  }

  private buySkill(id: SkillId): boolean {
    const def: SkillDef | undefined = SKILL_BY_ID[id];
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

  private applySkills(fill: boolean) {
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

  private resetPlayer(full: boolean) {
    const p: Player = this.player ?? ({} as Player);
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

  private clearCombat() {
    for (const e of this.enemies) e.alive = false;
    for (const b of this.bullets) b.alive = false;
    for (const p of this.pickups) p.alive = false;
    for (const p of this.parts) p.alive = false;
    for (const f of this.floaters) f.alive = false;
    for (const m of this.muzzles) m.alive = false;
    this.inWave = false;
    this.waveWait = 0;
  }

  private resize() {
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

  private seedStars() {
    const n = Math.min(220, Math.floor((this.w * this.h) / 2800));
    this.stars = Array.from({ length: n }, () => ({
      x: Math.random() * this.w,
      y: Math.random() * this.h,
      z: pick([0.18, 0.45, 0.85, 1.15]),
      s: rand(0.6, 2.2),
    }));
  }

  private handlePhaseInput(a: InputState) {
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

  private nextWave() {
    this.wave += 1;
    this.inWave = true;
    this.waveWait = 2.4;
    this.banner = this.wave % 5 === 0 ? `Cruiser inbound · Wave ${this.wave}` : `Wave ${this.wave}`;
    this.bannerT = 2.1;
    sfx("wave");
    const n = this.wave;
    let spawned = 0;
    const spawn = (kind: EnemyKind, count: number) => {
      for (let i = 0; i < count; i++) {
        if (this.spawnEnemy(kind)) spawned += 1;
      }
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

  private spawnEnemy(kind: EnemyKind): boolean {
    const e = this.enemies.find((x) => !x.alive);
    if (!e) return false;
    const spec = KIND[kind];
    const edge = (Math.random() * 4) | 0;
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
    e.hp = spec.hp + Math.floor(this.wave * (kind === "cruiser" ? 2.2 : 0.35));
    e.maxHp = e.hp;
    e.r = spec.r;
    e.value = spec.value;
    e.fireCd = rand(0.4, spec.fire || 1);
    e.flash = 0;
    e.knock = 0;
    e.aim = Math.atan2(this.player.y - y, this.player.x - x);
    return true;
  }

  private spawnPickup(x: number, y: number, kind?: PickupKind) {
    const p = this.pickups.find((q) => !q.alive);
    if (!p) return;
    p.alive = true;
    p.kind = kind ?? pick(["multi", "shield", "speed", "repair"]);
    p.x = x;
    p.y = y;
    p.ttl = 12;
    p.bob = Math.random() * Math.PI * 2;
  }

  private burst(x: number, y: number, n: number, color: string, spd: number, additive = true) {
    for (let i = 0; i < n; i++) {
      const p = this.parts.find((q) => !q.alive);
      if (!p) return;
      const a = Math.random() * Math.PI * 2;
      const s = rand(spd * 0.3, spd);
      p.alive = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(a) * s;
      p.vy = Math.sin(a) * s;
      p.life = p.max = rand(0.25, 0.7);
      p.size = rand(1.4, 3.6);
      p.color = color;
      p.drag = rand(2.2, 4.5);
      p.additive = additive;
    }
  }

  private float(x: number, y: number, text: string, color: string) {
    const f = this.floaters.find((q) => !q.alive);
    if (!f) return;
    f.alive = true;
    f.x = x;
    f.y = y;
    f.vy = -36;
    f.text = text;
    f.life = 0.85;
    f.color = color;
  }

  private muzzle(x: number, y: number, rot: number) {
    const m = this.muzzles.find((q) => !q.alive);
    if (!m) return;
    m.alive = true;
    m.x = x;
    m.y = y;
    m.rot = rot;
    m.life = m.max = 0.07;
  }

  private fireBullet(
    x: number,
    y: number,
    ang: number,
    spd: number,
    friendly: boolean,
    dmg: number,
    r: number,
    ttl: number,
    pierce = 0,
    homing = 0,
  ) {
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

  private stepAttract(dt: number) {
    this.t += dt;
    this.driftStars(dt, Math.sin(this.t * 0.3) * 40, 18);
    for (const p of this.parts) if (p.alive) this.stepPart(p, dt);
  }

  private step(dt: number, a: InputState) {
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
      p.vx += (dx / n) * 540;
      p.vy += (dy / n) * 540;
      p.dashCd = 1.45;
      p.invuln = Math.max(p.invuln, 0.2);
      this.burst(p.x, p.y, 14, "#8eb8c8", 220);
      sfx("dash");
    }

    p.x = clamp(p.x + p.vx * dt, PAD, this.w - PAD);
    p.y = clamp(p.y + p.vy * dt, PAD, this.h - PAD);
    if (p.x === PAD || p.x === this.w - PAD) p.vx *= 0.2;
    if (p.y === PAD || p.y === this.h - PAD) p.vy *= 0.2;

    const stick = Math.hypot(a.aimSX, a.aimSY);
    if (stick > 0.12) {
      p.want = Math.atan2(a.aimSY, a.aimSX);
      this.aimVis.showPointer = false;
    } else if (a.hasPointer) {
      p.want = Math.atan2(a.pointerY - p.y, a.pointerX - p.x);
      this.aimVis = { showPointer: true, px: a.pointerX, py: a.pointerY };
    } else {
      this.aimVis.showPointer = false;
    }
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

    if (Math.random() < dt * 18) {
      this.burst(p.x - Math.cos(p.aim) * 12, p.y - Math.sin(p.aim) * 12, 1, "rgba(142,184,200,0.7)", 20, true);
    }
    if (Math.abs(p.omega) > 5 && Math.random() < dt * 22) {
      const side = p.omega > 0 ? 1 : -1;
      const px = p.x + Math.cos(p.aim) * 4 - Math.sin(p.aim) * side * 12;
      const py = p.y + Math.sin(p.aim) * 4 + Math.cos(p.aim) * side * 12;
      this.burst(px, py, 1, "rgba(232,234,239,0.55)", 40, true);
    }
  }

  private stepYaw(p: Player, dt: number) {
    const err = wrapAng(p.want - p.aim);
    const agile = p.speedMul * (p.speedT > 0 ? 1.12 : 1);
    const k = (this.reduced ? 780 : 220) * agile;
    const zeta = this.reduced ? 1.05 : 0.7;
    const damp = 2 * zeta * Math.sqrt(k);
    const maxW = (this.reduced ? 28 : 16.8) * agile;
    p.omega += (k * err - damp * p.omega) * dt;
    p.omega = clamp(p.omega, -maxW, maxW);
    if (Math.abs(err) < 0.006 && Math.abs(p.omega) < 0.18) {
      p.omega = 0;
      p.aim = p.want;
      return;
    }
    p.aim = wrapAng(p.aim + p.omega * dt);
  }

  private shootPlayer() {
    const p = this.player;
    const rate = 0.155 / p.fireMul;
    p.fireCd = rate;
    const extra = p.extraShots + (p.multiT > 0 ? 2 : 0);
    const spread = extra === 0 ? [0] : extra === 2 ? [-0.16, 0, 0.16] : extra === 4 ? [-0.28, -0.12, 0, 0.12, 0.28] : [-0.22, 0, 0.22];
    const nose = 20;
    const ox = p.x + Math.cos(p.aim) * nose;
    const oy = p.y + Math.sin(p.aim) * nose;
    let torque = 0;
    for (const off of spread) {
      this.fireBullet(ox, oy, p.aim + off, 620, true, 1 * p.dmgMul, 4.2, 0.85, p.pierce, p.homing);
      torque += off * 9;
    }
    p.omega += torque;
    p.vx -= Math.cos(p.aim) * 10;
    p.vy -= Math.sin(p.aim) * 10;
    this.muzzle(ox, oy, p.aim);
    sfx("shoot");
    this.trauma = Math.min(1, this.trauma + 0.045);
  }

  private stepWorld(dt: number) {
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
          tx += (sx / sd) * 0.7;
          ty += (sy / sd) * 0.7;
        }
      }
      const tn = Math.hypot(tx, ty) || 1;
      const spd = spec.spd * (1 + this.wave * 0.03);
      e.vx = (tx / tn) * spd;
      e.vy = (ty / tn) * spd;
      if (e.knock > 0) {
        e.x += e.vx * dt * 0.2;
        e.y += e.vy * dt * 0.2;
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
          e.fireCd = spec.fire * (e.kind === "cruiser" ? 1 : 1 + Math.random() * 0.2);
          const ang = e.aim;
          if (e.kind === "bomber") {
            for (const off of [-0.22, 0, 0.22]) this.fireBullet(e.x, e.y, ang + off, 240, false, 1, 5, 2.4);
          } else if (e.kind === "cruiser") {
            this.fireBullet(e.x, e.y, ang, 280, false, 1, 6, 2.6);
            this.fireBullet(e.x, e.y, ang + 0.18, 260, false, 1, 5, 2.4);
            this.fireBullet(e.x, e.y, ang - 0.18, 260, false, 1, 5, 2.4);
          } else {
            this.fireBullet(e.x, e.y, ang, 270, false, 1, 4.5, 2.2);
          }
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
      } else {
        b.rot = Math.atan2(b.vy, b.vx);
      }
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
        u.x += (dx / d) * 220 * dt;
        u.y += (dy / d) * 220 * dt;
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

  private stepPart(q: Particle, dt: number) {
    q.x += q.vx * dt;
    q.y += q.vy * dt;
    const drag = Math.exp(-q.drag * dt);
    q.vx *= drag;
    q.vy *= drag;
    q.life -= dt;
    if (q.life <= 0) q.alive = false;
  }

  private collisions() {
    const p = this.player;
    for (const b of this.bullets) {
      if (!b.alive) continue;
      if (b.friendly) {
        for (const e of this.enemies) {
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
      } else if (p.deadT <= 0 && p.invuln <= 0) {
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
          e.x += (dx / n) * 8;
          e.y += (dy / n) * 8;
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

  private takePickup(kind: PickupKind) {
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

  private hurtEnemy(e: Enemy, dmg: number, ang: number) {
    e.hp -= dmg;
    e.flash = 0.06;
    e.knock = 0.05;
    e.x += Math.cos(ang) * 6;
    e.y += Math.sin(ang) * 6;
    this.burst(e.x, e.y, 4, "#e8eaef", 140);
    sfx("hit");
    if (e.hp <= 0) this.killEnemy(e);
  }

  private killEnemy(e: Enemy) {
    e.alive = false;
    this.combo = Math.min(8, this.combo + 1);
    this.comboT = 1.25;
    const pts = e.value * this.combo;
    this.score += pts;
    this.float(e.x, e.y, `+${pts}`, "#e8eaef");
    this.burst(e.x, e.y, e.kind === "cruiser" ? 36 : 16, e.kind === "cruiser" ? "#c56b6b" : "#d48a6a", 260);
    this.trauma = Math.min(1, this.trauma + (e.kind === "cruiser" ? 0.55 : 0.18));
    this.hitstop = e.kind === "cruiser" ? 0.07 : 0.028;
    sfx("explode");
    this.input.rumble(e.kind === "cruiser" ? 0.7 : 0.25, 0.5, e.kind === "cruiser" ? 140 : 40);
    const drop = e.kind === "cruiser" ? 1 : e.kind === "bomber" ? 0.28 : 0.12;
    if (Math.random() < drop) this.spawnPickup(e.x, e.y);
    if (e.kind === "cruiser") {
      this.spawnPickup(e.x + 16, e.y, "shield");
      this.forge += 1;
    }
  }

  private hurtPlayer(n: number) {
    const p = this.player;
    if (p.invuln > 0 || p.deadT > 0) return;
    if (p.shield > 0) {
      p.shield = Math.max(0, p.shield - n);
      p.invuln = 0.35;
      this.burst(p.x, p.y, 10, "#7dba9a", 180);
      sfx("hit");
      this.trauma = Math.min(1, this.trauma + 0.25);
      this.input.rumble(0.2, 0.45, 50);
      return;
    }
    p.hp -= n;
    p.invuln = 0.7;
    this.trauma = Math.min(1, this.trauma + 0.45);
    this.hitstop = 0.055;
    sfx("hurt");
    this.input.rumble(0.55, 0.8, 120);
    this.burst(p.x, p.y, 14, "#c56b6b", 200);
    if (p.hp <= 0) {
      p.lives -= 1;
      p.deadT = 1.15;
      p.hp = 0;
      this.burst(p.x, p.y, 28, "#8eb8c8", 280);
      sfx("explode");
    }
  }

  private waveLogic(dt: number) {
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

  private gameOver() {
    sfx("over");
    const q = qualifies(this.score);
    useGame.getState().setQualify(q, this.score, this.wave);
    useGame.getState().setScores(getScores());
    this.setPhase("gameover");
  }

  private nearestEnemy(x: number, y: number): Enemy | null {
    let best: Enemy | null = null;
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

  private driftStars(dt: number, vx: number, vy: number) {
    for (const s of this.stars) {
      s.x -= vx * s.z * 0.22 * dt + s.z * 14 * dt;
      s.y -= vy * s.z * 0.22 * dt;
      if (s.x < 0) s.x += this.w;
      if (s.x > this.w) s.x -= this.w;
      if (s.y < 0) s.y += this.h;
      if (s.y > this.h) s.y -= this.h;
    }
  }

  private publishHud() {
    const p = this.player;
    const snap: HudSnap = {
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
      padOn: this.padOn || this.input.padLive,
    };
    useGame.getState().setHud(snap);
  }

  private draw() {
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
      const a = 0.25 + s.z * 0.55;
      ctx.fillStyle = s.z > 0.8 ? `rgba(232,234,239,${a})` : `rgba(142,184,200,${a})`;
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
      if (this.atlas?.powerups) {
        drawFrame(ctx, this.atlas.powerups, PICK_FRAME[u.kind], u.x, u.y + bob, 28, 28);
      } else {
        ctx.fillStyle = "#8eb8c8";
        ctx.beginPath();
        ctx.arc(u.x, u.y + bob, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (const b of this.bullets) {
      if (!b.alive) continue;
      const sheet = b.friendly ? this.atlas?.boltPlayer : this.atlas?.boltEnemy;
      const frame = ((this.t * 12) | 0) % 4;
      if (sheet) {
        drawFrame(ctx, sheet, frame, b.x, b.y, b.friendly ? 18 : 16, b.friendly ? 28 : 22, b.rot + Math.PI / 2);
      } else {
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
      if (this.atlas?.enemies) {
        drawFrame(ctx, this.atlas.enemies, spec.frame, e.x, e.y, size, size, e.aim + Math.PI / 2, e.flash > 0 ? 1 : 1);
      } else {
        this.drawPoly(ctx, e.x, e.y, e.aim, spec.r, "#c56b6b");
      }
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
        ctx.strokeStyle = `rgba(125,186,154,${0.35 + 0.25 * Math.sin(this.t * 6)})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + 10, 0, Math.PI * 2);
        ctx.stroke();
      }
      const blink = p.invuln > 0 && Math.sin(this.t * 28) < 0 ? 0.35 : 1;
      const bank = clamp(p.omega * 0.038, -0.38, 0.38);
      const squash = 1 + Math.min(0.14, Math.abs(p.omega) * 0.01);
      const drawRot = p.aim + Math.PI / 2 + bank;
      if (this.atlas?.player) {
        drawFrame(ctx, this.atlas.player, 0, p.x, p.y, 46, 46, drawRot, blink, squash, 1 / squash);
      } else {
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
      if (this.aimVis.showPointer) {
        ctx.lineTo(this.aimVis.px, this.aimVis.py);
      } else {
        ctx.lineTo(p.x + wc * 110, p.y + ws * 110);
      }
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
      ctx.globalAlpha = clamp(f.life / 0.4, 0, 1);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, f.x, f.y);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  private drawPoly(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    aim: number,
    r: number,
    color: string,
    squash = 1,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(aim + Math.PI / 2);
    ctx.scale(squash, 1 / squash);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.72, r * 0.7);
    ctx.lineTo(0, r * 0.28);
    ctx.lineTo(-r * 0.72, r * 0.7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

declare global {
  interface Window {
    __controlsTest?: {
      getYaw: () => number;
      getWant?: () => number;
      getOmega?: () => number;
      getSpeed: () => number;
      getX: () => number;
      getY: () => number;
      setKeys?: (codes: string[]) => void;
      setSteer?: (v: number) => void;
    };
  }
}
