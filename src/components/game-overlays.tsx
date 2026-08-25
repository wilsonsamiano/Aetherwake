import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import {
  Coffee,
  Gauge,
  Gamepad2,
  Map as MapIcon,
  Pause,
  Play,
  Shield,
  Volume2,
  VolumeX,
  Zap,
  X,
  ChevronsUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gameInput } from "@/game/input";
import { SKILL_BY_ID, SKILL_EDGES, SKILLS, isAvailable } from "@/game/skills";
import { useGame } from "@/game/store";
import { FullscreenButtons } from "@/components/fullscreen-ui";
import { InstallApp } from "@/components/install-app";

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-auto w-[min(440px,calc(100vw-2rem))] rounded-xl border border-border bg-surface/92 p-6 text-fg shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Overlay({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center bg-bg/70 p-4 pb-[max(5.5rem,env(safe-area-inset-bottom))] backdrop-blur-[2px] sm:pb-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

const COFFEE_URL = "https://buymeacoffee.com/wilsonsamiano";

function CoffeeLink({ className }: { className?: string }) {
  return (
    <Button variant="ghost" className={cn("w-full", className)} asChild>
      <a href={COFFEE_URL} target="_blank" rel="noopener noreferrer">
        <Coffee className="size-4" />
        Buy me a coffee
      </a>
    </Button>
  );
}

export function TitleScreen() {
  const api = useGame((s) => s.api);
  return (
    <div className="absolute inset-0 z-20 flex min-h-0 flex-col">
      <div className="absolute inset-0 overflow-hidden bg-bg">
        <img
          src="/title-mobile.jpg"
          alt=""
          width={1080}
          height={1440}
          draggable={false}
          decoding="async"
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 h-full w-full select-none object-contain object-top sm:hidden"
        />
        <img
          src="/title.jpg"
          alt=""
          width={1200}
          height={630}
          draggable={false}
          decoding="async"
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 hidden h-full w-full select-none object-cover object-center sm:block"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[40%] bg-gradient-to-t from-bg via-bg/70 to-transparent sm:h-1/3"
          aria-hidden
        />
      </div>
      <div className="pointer-events-auto relative z-10 mt-auto mx-auto w-full max-w-[440px] shrink-0 px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2 sm:pb-6">
        <div className="rounded-xl border border-border bg-surface/90 p-4 text-fg shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur-sm">
          <div className="flex flex-col gap-3">
            <Button size="lg" className="w-full" disabled={!api} onClick={() => api?.start()}>
              <Play className="size-4" />
              Engage
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="ghost" onClick={() => api?.toHelp()}>
                Briefing
              </Button>
              <Button variant="ghost" onClick={() => api?.toScores()}>
                Records
              </Button>
            </div>
            <FullscreenButtons labeled />
            <InstallApp />
            <CoffeeLink />
          </div>
        </div>
      </div>
    </div>
  );
}

export function HelpScreen() {
  const api = useGame((s) => s.api);
  return (
    <Overlay>
      <Panel>
        <h2 className="font-display text-xl font-semibold">Briefing</h2>
        <ul className="mt-4 space-y-2 text-sm leading-relaxed text-muted">
          <li>
            <span className="text-fg">Move</span> with WASD or the left stick. Facing is not tied to thrust — strafe one way, fire another.
          </li>
          <li>
            <span className="text-fg">Aim</span> with the mouse or right stick. The hull has yaw mass — it slews onto the reticle instead of snapping. Shots leave the nose, so lead hard flicks. Auto-fire stays on.
          </li>
          <li>
            <span className="text-fg">Controller</span> — left stick move, right stick aim, RT fire, bumpers dash, A confirm, B back, Y/Select forge map, Start pause.
          </li>
          <li>
            <span className="text-fg">Keyboard only</span> — WASD move, arrows or IJKL aim, Enter confirm, Esc/P pause, F forge map, M mute.
          </li>
          <li>
            <span className="text-fg">Touch</span> — left well strafes, right well aims. Auto-fire stays on. Blink dash is the pad between the wells. Pause and forge sit at the top.
          </li>
          <li>
            <span className="text-fg">Forge bay</span> — after every wave the bay holds. Spend forge on the constellation, then Engage the next hull. Each wake brings a new arm: ram probes, tracers, spread cones, splitters, cruisers, rails, mines, flak, mortars.
          </li>
          <li>
            Pickups: multi-shot, shield, speed, repair.
          </li>
        </ul>
        <CoffeeLink className="mt-6" />
        <Button className="mt-3 w-full" variant="ghost" onClick={() => api?.toTitle()}>
          Close
        </Button>
      </Panel>
    </Overlay>
  );
}

export function PauseMenu() {
  const api = useGame((s) => s.api);
  const settings = useGame((s) => s.settings);
  const hud = useGame((s) => s.hud);
  return (
    <Overlay>
      <Panel className="text-center">
        <p className="font-display text-xs uppercase tracking-[0.24em] text-muted">Systems held</p>
        <h2 className="mt-1 font-display text-3xl font-semibold">Paused</h2>
        <p className="mt-2 font-mono text-sm text-muted">
          Wave {hud.wave} · {hud.score.toLocaleString()}
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button size="lg" onClick={() => api?.resume()}>
            <Play className="size-4" />
            Resume
          </Button>
          <Button variant="ghost" onClick={() => api?.openSkills()}>
            <MapIcon className="size-4" />
            Forge map
            {hud.unspent > 0 ? <span className="rounded-full bg-accent px-2 py-0.5 text-xs text-accent-fg">{hud.unspent}</span> : null}
          </Button>
          <Button variant="ghost" onClick={() => api?.setSettings({ mute: !settings.mute })}>
            {settings.mute ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            {settings.mute ? "Sound off" : "Sound on"}
          </Button>
          <Button variant="ghost" onClick={() => api?.setSettings({ shake: !settings.shake })}>
            <Gauge className="size-4" />
            Shake {settings.shake ? "on" : "off"}
          </Button>
          <FullscreenButtons labeled />
          <Button variant="ghost" onClick={() => api?.toTitle()}>
            Abandon run
          </Button>
        </div>
      </Panel>
    </Overlay>
  );
}

export function GameOver() {
  const api = useGame((s) => s.api);
  const qualify = useGame((s) => s.qualify);
  const score = useGame((s) => s.lastScore);
  const wave = useGame((s) => s.lastWave);
  const [name, setName] = useState("Pilot");
  return (
    <Overlay>
      <Panel className="text-center">
        <p className="font-display text-xs uppercase tracking-[0.24em] text-danger">Signal lost</p>
        <h2 className="mt-1 font-display text-3xl font-semibold">Wake collapsed</h2>
        <p className="mt-3 font-mono text-lg tabular-nums text-fg">{score.toLocaleString()}</p>
        <p className="text-sm text-muted">Wave {wave}</p>
        {qualify ? (
          <form
            className="mt-5 space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              api?.submitName(name);
            }}
          >
            <label className="block text-left text-xs uppercase tracking-wider text-muted">
              Callsign
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={12}
                className="mt-1 h-11 w-full rounded-[12px] border border-border bg-elevated px-3 font-display text-fg outline-none focus:ring-2 focus:ring-accent/70"
              />
            </label>
            <Button type="submit" className="w-full">
              Save record
            </Button>
          </form>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            <Button onClick={() => api?.start()}>Again</Button>
            <Button variant="ghost" onClick={() => api?.toScores()}>
              Records
            </Button>
            <Button variant="ghost" onClick={() => api?.toTitle()}>
              Title
            </Button>
          </div>
        )}
      </Panel>
    </Overlay>
  );
}

export function HighScores() {
  const api = useGame((s) => s.api);
  const scores = useGame((s) => s.scores);
  return (
    <Overlay>
      <Panel>
        <h2 className="font-display text-xl font-semibold">Records</h2>
        <ol className="mt-4 space-y-2">
          {scores.length === 0 ? (
            <li className="text-sm text-muted">No wakes logged yet.</li>
          ) : (
            scores.map((s, i) => (
              <li
                key={`${s.at}-${i}`}
                className="flex items-baseline justify-between gap-3 border-b border-border py-2 font-mono text-sm tabular-nums"
              >
                <span className="text-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 font-display text-fg">{s.name}</span>
                <span className="text-muted">W{s.wave}</span>
                <span className="text-fg">{s.score.toLocaleString()}</span>
              </li>
            ))
          )}
        </ol>
        <Button className="mt-6 w-full" variant="ghost" onClick={() => api?.toTitle()}>
          Close
        </Button>
      </Panel>
    </Overlay>
  );
}

export function SkillMap() {
  const api = useGame((s) => s.api);
  const phase = useGame((s) => s.phase);
  const owned = new Set(useGame((s) => s.owned));
  const forge = useGame((s) => s.hud.forge);
  const sel = useGame((s) => s.skillId);
  const briefing = useGame((s) => s.briefing);
  const bay = phase === "forge";
  const def = SKILL_BY_ID[sel];
  const avail = isAvailable(sel, owned);
  const canBuy = avail && forge >= def.cost && def.cost > 0 && !owned.has(sel);

  return (
    <Overlay className="p-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:p-4">
      <div
        data-forge-panel
        className="pointer-events-auto flex h-[min(40rem,calc(100dvh-1.25rem))] w-[min(48rem,calc(100vw-0.75rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface/96 shadow-[0_24px_80px_rgba(0,0,0,0.5)] sm:h-[min(38rem,calc(100dvh-1.75rem))]"
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-3 py-3 sm:px-4">
          <div className="min-w-0">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-accent">
              {bay ? `Wave ${briefing.cleared} cleared` : "Constellation"}
            </p>
            <h2 className="truncate font-display text-xl font-semibold leading-tight">
              {bay ? `Next · ${briefing.title}` : "Forge map"}
            </h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <p className="font-mono text-lg tabular-nums text-fg">
              <span className="text-muted">Forge </span>
              {forge}
            </p>
            {bay ? null : (
              <button
                type="button"
                aria-label="Close forge map"
                className="grid size-11 place-items-center rounded-[12px] border border-border text-fg hover:bg-elevated"
                onClick={() => api?.closeSkills()}
              >
                <X className="size-4" />
              </button>
            )}
          </div>
        </header>
        {bay ? (
          <div className="shrink-0 border-b border-border px-3 py-2 sm:px-4">
            <p className="font-display text-sm font-semibold uppercase tracking-[0.14em] text-accent">
              {briefing.threat}
            </p>
            <p className="mt-0.5 text-sm leading-snug text-muted sm:truncate">{briefing.blurb}</p>
          </div>
        ) : null}
        <div data-forge-map className="min-h-0 flex-1 overflow-hidden p-2 sm:hidden">
          <div className="grid h-full grid-cols-3 grid-rows-6 gap-1.5">
            {SKILLS.map((s) => {
              const isOwned = owned.has(s.id);
              const isAvail = isAvailable(s.id, owned) || s.id === "core";
              const selected = sel === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={cn(
                    "flex min-h-0 flex-col items-center justify-center rounded-[12px] border px-1 font-display leading-tight",
                    selected ? "border-fg bg-elevated text-fg" : "border-border bg-bg/50",
                    !selected && (isOwned || isAvail ? "text-fg" : "text-subtle"),
                  )}
                  onClick={() => useGame.getState().setSkillId(s.id)}
                >
                  <span className="text-base font-semibold tracking-wide">{s.short}</span>
                  <span className={cn("text-sm tabular-nums", isAvail && !isOwned ? "text-accent" : "text-muted")}>
                    {s.id === "core" ? "core" : s.cost}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        <div data-forge-map className="relative hidden min-h-0 flex-1 overflow-hidden sm:block">
          <svg viewBox="0 0 1000 500" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
            {SKILL_EDGES.map(([a, b]) => {
              const na = SKILL_BY_ID[a];
              const nb = SKILL_BY_ID[b];
              const on = owned.has(a) && owned.has(b);
              return (
                <line
                  key={`${a}-${b}`}
                  x1={na.x * 1000}
                  y1={na.y * 500}
                  x2={nb.x * 1000}
                  y2={nb.y * 500}
                  stroke={on ? "#8eb8c8" : "rgba(232,234,239,0.14)"}
                  strokeWidth={on ? 2.6 : 1.3}
                />
              );
            })}
            {SKILLS.map((s) => {
              const isOwned = owned.has(s.id);
              const isAvail = isAvailable(s.id, owned) || s.id === "core";
              const selected = sel === s.id;
              const cx = s.x * 1000;
              const cy = s.y * 500;
              return (
                <g key={s.id} transform={`translate(${cx} ${cy})`} className="cursor-pointer">
                  <circle r={48} fill="transparent" onClick={() => useGame.getState().setSkillId(s.id)} />
                  <circle
                    r={selected ? 28 : 24}
                    fill={isOwned ? "#8eb8c8" : isAvail ? "#1a1d27" : "#12141c"}
                    stroke={selected ? "#e8eaef" : isAvail ? "#8eb8c8" : "rgba(232,234,239,0.2)"}
                    strokeWidth={selected ? 2.8 : 1.5}
                    onClick={() => useGame.getState().setSkillId(s.id)}
                  />
                  <text
                    textAnchor="middle"
                    y={7}
                    fill={isOwned ? "#08090d" : isAvail ? "#e8eaef" : "#5c6170"}
                    fontSize="18"
                    fontFamily="Oxanium, sans-serif"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {s.id === "core" ? "CORE" : s.cost}
                  </text>
                  <text
                    textAnchor="middle"
                    y={46}
                    fill={selected ? "#e8eaef" : isOwned || isAvail ? "#8b90a0" : "#5c6170"}
                    fontSize="16"
                    fontFamily="Oxanium, sans-serif"
                    fontWeight="600"
                    letterSpacing="0.08em"
                    pointerEvents="none"
                  >
                    {s.short}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <footer className="flex shrink-0 flex-col gap-2 border-t border-border px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold leading-tight">{def.name}</p>
            <p className="mt-0.5 text-base leading-snug text-muted sm:truncate sm:text-sm">{def.desc}</p>
          </div>
          <div className="flex w-full shrink-0 flex-row gap-2 sm:w-auto">
            <Button
              variant={bay ? "ghost" : "primary"}
              className="h-12 flex-1 text-base sm:h-11 sm:flex-none sm:text-sm"
              disabled={!canBuy}
              onClick={() => {
                api?.buySkill(sel);
              }}
            >
              {owned.has(sel) ? "Online" : canBuy ? `Forge · ${def.cost}` : def.cost === 0 ? "Core" : "Locked"}
            </Button>
            {bay ? (
              <Button className="h-12 flex-1 text-base sm:h-11 sm:flex-none sm:text-sm" onClick={() => api?.advanceWave()}>
                <Play className="size-4" />
                Engage · Wave {briefing.next}
              </Button>
            ) : null}
          </div>
        </footer>
      </div>
    </Overlay>
  );
}

export function Hud() {
  const phase = useGame((s) => s.phase);
  const hud = useGame((s) => s.hud);
  const api = useGame((s) => s.api);
  if (phase === "title" || phase === "help" || phase === "scores") return null;
  const show = phase === "playing" || phase === "paused" || phase === "skills" || phase === "forge" || phase === "gameover";
  if (!show) return null;
  const hpPct = hud.maxHp ? (hud.hp / hud.maxHp) * 100 : 0;
  const shPct = hud.maxShield ? (hud.shield / hud.maxShield) * 100 : 0;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-[16px] border border-border bg-bg/55 px-3 py-2 backdrop-blur-sm">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.16em] text-muted">Score</p>
          <p className="font-mono text-2xl tabular-nums text-fg">{hud.score.toLocaleString()}</p>
          <div className="mt-2 h-1.5 w-36 overflow-hidden rounded-full bg-elevated">
            <div className="h-full bg-danger" style={{ width: `${hpPct}%` }} />
          </div>
          {hud.maxShield > 0 ? (
            <div className="mt-1 h-1 w-36 overflow-hidden rounded-full bg-elevated">
              <div className="h-full bg-ok" style={{ width: `${shPct}%` }} />
            </div>
          ) : null}
          <div className="mt-2 flex gap-1">
            {Array.from({ length: 3 }).map((_, i) => (
              <span
                key={i}
                className={cn("block h-2 w-2 rotate-45", i < hud.lives ? "bg-accent" : "bg-elevated")}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <p className="rounded-[16px] border border-border bg-bg/55 px-3 py-2 font-mono text-base tabular-nums text-fg backdrop-blur-sm">
            W{hud.wave}
            {hud.combo > 1 ? <span className="ml-2 text-accent">x{hud.combo}</span> : null}
            {hud.padOn ? (
              <span className="ml-2 inline-flex items-center gap-1 text-[11px] text-accent">
                <Gamepad2 className="size-3" />
                PAD
              </span>
            ) : null}
          </p>
          {phase === "playing" ? (
            <div className="pointer-events-auto flex gap-2">
              <button
                type="button"
                className="grid size-11 place-items-center rounded-[12px] border border-border bg-surface/80 text-fg"
                onClick={() => api?.openSkills()}
                aria-label="Open forge map"
              >
                <MapIcon className="size-4" />
              </button>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-[12px] border border-border bg-surface/80 text-fg"
                onClick={() => api?.pause()}
                aria-label="Pause"
              >
                <Pause className="size-4" />
              </button>
            </div>
          ) : null}
        </div>
      </div>
      {hud.banner ? (
        <p className="pointer-events-none mt-6 text-center font-display text-sm uppercase tracking-[0.22em] text-fg">
          {hud.banner}
        </p>
      ) : null}
      <div className="absolute bottom-[max(9rem,env(safe-area-inset-bottom))] right-3 flex flex-col items-end gap-1 sm:bottom-5 sm:right-5">
        {hud.multiT > 0 ? (
          <span className="flex items-center gap-1 rounded-full border border-border bg-bg/60 px-2 py-1 font-mono text-[11px] text-accent">
            <Zap className="size-3" /> {hud.multiT.toFixed(0)}s
          </span>
        ) : null}
        {hud.speedT > 0 ? (
          <span className="flex items-center gap-1 rounded-full border border-border bg-bg/60 px-2 py-1 font-mono text-[11px] text-fg">
            SPD {hud.speedT.toFixed(0)}s
          </span>
        ) : null}
        {hud.maxShield > 0 ? (
          <span className="flex items-center gap-1 rounded-full border border-border bg-bg/60 px-2 py-1 font-mono text-[11px] text-ok">
            <Shield className="size-3" /> {hud.shield}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function useTouchUi() {
  const [on, setOn] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches ||
      window.matchMedia("(max-width: 48rem)").matches
    );
  });

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 48rem)");
    const coarse = window.matchMedia("(pointer: coarse)");
    const sync = () => {
      setOn(navigator.maxTouchPoints > 0 || coarse.matches || narrow.matches);
    };
    const onPtr = (e: PointerEvent) => {
      if (e.pointerType === "touch" || e.pointerType === "pen") setOn(true);
    };
    narrow.addEventListener("change", sync);
    coarse.addEventListener("change", sync);
    window.addEventListener("pointerdown", onPtr);
    sync();
    return () => {
      narrow.removeEventListener("change", sync);
      coarse.removeEventListener("change", sync);
      window.removeEventListener("pointerdown", onPtr);
    };
  }, []);

  return on;
}

function DualSticks() {
  const moveRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const aimRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const [moveKnob, setMoveKnob] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const [aimKnob, setAimKnob] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const canDash = useGame((s) => s.hud.canDash);
  const dashCd = useGame((s) => s.hud.dashCd);
  const R = 56;
  const well = "max(6.5rem, calc(env(safe-area-inset-bottom) + 5rem))";

  const vec = (ox: number, oy: number, cx: number, cy: number) => {
    let x = cx - ox;
    let y = cy - oy;
    const m = Math.hypot(x, y);
    if (m > R) {
      x = (x / m) * R;
      y = (y / m) * R;
    }
    return { x, y };
  };

  const send = (side: "left" | "right", x: number, y: number, on: boolean) => {
    const mag = Math.hypot(x, y) / R;
    const nx = mag < 0.16 ? 0 : x / R;
    const ny = mag < 0.16 ? 0 : y / R;
    if (side === "left") gameInput?.setTouchMove(nx, ny, on);
    else gameInput?.setTouchAim(nx, ny, on);
  };

  const grab = (side: "left" | "right", e: ReactPointerEvent) => {
    const slot = side === "left" ? moveRef : aimRef;
    if (slot.current) return;
    e.preventDefault();
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic pointers in QA have no capture */
    }
    slot.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
    const k = vec(e.clientX, e.clientY, e.clientX, e.clientY);
    if (side === "left") setMoveKnob({ ox: e.clientX, oy: e.clientY, x: k.x, y: k.y });
    else setAimKnob({ ox: e.clientX, oy: e.clientY, x: k.x, y: k.y });
    send(side, 0, 0, true);
  };

  const movePtr = (e: ReactPointerEvent) => {
    const apply = (
      slot: { id: number; ox: number; oy: number },
      set: typeof setMoveKnob,
      side: "left" | "right",
    ) => {
      if (slot.id !== e.pointerId) return;
      const k = vec(slot.ox, slot.oy, e.clientX, e.clientY);
      set({ ox: slot.ox, oy: slot.oy, x: k.x, y: k.y });
      send(side, k.x, k.y, true);
    };
    if (moveRef.current) apply(moveRef.current, setMoveKnob, "left");
    if (aimRef.current) apply(aimRef.current, setAimKnob, "right");
  };

  const release = (id: number) => {
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

  const zone = (side: "left" | "right") => ({
    onPointerDown: (e: ReactPointerEvent) => grab(side, e),
    onPointerMove: movePtr,
    onPointerUp: (e: ReactPointerEvent) => release(e.pointerId),
    onPointerCancel: (e: ReactPointerEvent) => release(e.pointerId),
    onLostPointerCapture: (e: ReactPointerEvent) => release(e.pointerId),
  });

  return (
    <div className="pointer-events-none absolute inset-0 z-20">
      <div
        data-touch-move
        aria-label="Move stick"
        className="pointer-events-auto absolute bottom-0 left-0 top-[38%] w-[48%] touch-none"
        {...zone("left")}
      />
      <div
        data-touch-aim
        aria-label="Aim stick"
        className="pointer-events-auto absolute bottom-0 right-0 top-[38%] w-[48%] touch-none"
        {...zone("right")}
      />
      <StickWell
        label="Move"
        side="left"
        bottom={well}
        knob={moveKnob ? { x: moveKnob.x, y: moveKnob.y } : { x: 0, y: 0 }}
        active={!!moveKnob}
        r={R}
      />
      <StickWell
        label="Aim"
        side="right"
        bottom={well}
        knob={aimKnob ? { x: aimKnob.x, y: aimKnob.y } : { x: 0, y: 0 }}
        active={!!aimKnob}
        r={R}
      />
      {moveKnob ? <StickGhost knob={moveKnob} r={R} /> : null}
      {aimKnob ? <StickGhost knob={aimKnob} r={R} /> : null}
      {canDash ? (
        <button
          type="button"
          data-touch-dash
          aria-label="Dash"
          disabled={dashCd > 0.05}
          className="pointer-events-auto absolute left-1/2 z-20 grid size-12 -translate-x-1/2 place-items-center rounded-full border border-border bg-surface/80 text-fg touch-none disabled:opacity-40"
          style={{ bottom: well }}
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (dashCd > 0.05) return;
            gameInput?.queueDash();
          }}
        >
          <ChevronsUp className="size-5" />
        </button>
      ) : null}
    </div>
  );
}

function StickWell({
  label,
  side,
  bottom,
  knob,
  active,
  r,
}: {
  label: string;
  side: "left" | "right";
  bottom: string;
  knob: { x: number; y: number };
  active: boolean;
  r: number;
}) {
  return (
    <div
      className={cn("pointer-events-none absolute", side === "left" ? "left-3" : "right-3")}
      style={{ bottom, width: r * 2, height: r * 2 }}
    >
      <div
        className={cn(
          "absolute inset-0 rounded-full border bg-surface/50",
          active ? "border-fg/40" : "border-border",
        )}
      />
      <div
        className="absolute left-1/2 top-1/2 size-11 rounded-full border border-border-strong bg-elevated"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
      <p className="absolute left-1/2 top-full mt-1 -translate-x-1/2 font-display text-[10px] uppercase tracking-[0.2em] text-muted">
        {label}
      </p>
    </div>
  );
}

function StickGhost({
  knob,
  r,
}: {
  knob: { ox: number; oy: number; x: number; y: number };
  r: number;
}) {
  return (
    <div
      className="pointer-events-none fixed z-20 -translate-x-1/2 -translate-y-1/2"
      style={{ left: knob.ox, top: knob.oy, width: r * 2, height: r * 2 }}
    >
      <div className="absolute inset-0 rounded-full border border-border bg-surface/35" />
      <div
        className="absolute left-1/2 top-1/2 size-11 rounded-full border border-border-strong bg-elevated"
        style={{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }}
      />
    </div>
  );
}

export function TouchControls() {
  const phase = useGame((s) => s.phase);
  const playing = phase === "playing";
  const show = useTouchUi();

  useEffect(() => {
    if (!playing) {
      gameInput?.setTouchMove(0, 0, false);
      gameInput?.setTouchAim(0, 0, false);
    }
  }, [playing]);

  if (!playing || !show) return null;

  return <DualSticks />;
}
