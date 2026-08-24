import { useEffect, useRef, useState, type ReactNode } from "react";
import {
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { gameInput } from "@/game/input";
import { SKILL_BY_ID, SKILL_EDGES, SKILLS, isAvailable } from "@/game/skills";
import { useGame } from "@/game/store";
import type { SkillId } from "@/game/types";

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

function Overlay({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70 p-4 backdrop-blur-[2px]">
      {children}
    </div>
  );
}

export function TitleScreen() {
  const api = useGame((s) => s.api);
  return (
    <Overlay>
      <Panel className="text-center">
        <p className="font-display text-xs font-medium uppercase tracking-[0.28em] text-accent">Deep void protocol</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-[-0.04em] text-fg sm:text-5xl">
          Aetherwake
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Twin-stick void combat. WASD strafes, mouse aims. The hull yaws onto the reticle — shots leave the nose.
        </p>
        <div className="mt-6 flex flex-col gap-3">
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
        </div>
      </Panel>
    </Overlay>
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
            <span className="text-fg">Controller</span> — left stick move, right stick aim, Start/Select pause, A to engage from the title, bumpers dash (if unlocked).
          </li>
          <li>
            <span className="text-fg">Touch</span> — drag on the left half to move, right half to aim. Sticks appear under your thumbs.
          </li>
          <li>
            Pickups: multi-shot, shield, speed, repair. Clear waves to earn Forge and open the skill map.
          </li>
        </ul>
        <Button className="mt-6 w-full" variant="ghost" onClick={() => api?.toTitle()}>
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
  const owned = new Set(useGame((s) => s.owned));
  const forge = useGame((s) => s.hud.forge);
  const [sel, setSel] = useState<SkillId>("core");
  const def = SKILL_BY_ID[sel];
  const avail = isAvailable(sel, owned);
  const canBuy = avail && forge >= def.cost && def.cost > 0;

  return (
    <Overlay>
      <div className="pointer-events-auto flex h-[min(720px,calc(100dvh-2rem))] w-[min(980px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-xl border border-border bg-surface/94 shadow-[0_24px_80px_rgba(0,0,0,0.5)]">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <p className="font-display text-xs uppercase tracking-[0.22em] text-accent">Constellation</p>
            <h2 className="font-display text-lg font-semibold">Forge map</h2>
          </div>
          <div className="flex items-center gap-3">
            <p className="font-mono text-sm tabular-nums text-fg">
              <span className="text-muted">Forge </span>
              {forge}
            </p>
            <button
              type="button"
              aria-label="Close forge map"
              className="grid size-11 place-items-center rounded-[12px] border border-border text-fg hover:bg-elevated"
              onClick={() => api?.closeSkills()}
            >
              <X className="size-4" />
            </button>
          </div>
        </header>
        <div className="relative min-h-0 flex-1 overflow-auto">
          <svg viewBox="0 0 1000 720" className="h-auto w-full min-w-[640px] min-h-[460px]">
            {SKILL_EDGES.map(([a, b]) => {
              const na = SKILL_BY_ID[a];
              const nb = SKILL_BY_ID[b];
              const on = owned.has(a) && owned.has(b);
              return (
                <line
                  key={`${a}-${b}`}
                  x1={na.x * 1000}
                  y1={na.y * 720}
                  x2={nb.x * 1000}
                  y2={nb.y * 720}
                  stroke={on ? "#8eb8c8" : "rgba(232,234,239,0.14)"}
                  strokeWidth={on ? 2.4 : 1.2}
                />
              );
            })}
            {SKILLS.map((s) => {
              const isOwned = owned.has(s.id);
              const isAvail = isAvailable(s.id, owned) || s.id === "core";
              const selected = sel === s.id;
              const cx = s.x * 1000;
              const cy = s.y * 720;
              return (
                <g key={s.id} transform={`translate(${cx} ${cy})`} className="cursor-pointer">
                  <circle
                    r={selected ? 28 : 24}
                    fill={isOwned ? "#8eb8c8" : isAvail ? "#1a1d27" : "#12141c"}
                    stroke={selected ? "#e8eaef" : isAvail ? "#8eb8c8" : "rgba(232,234,239,0.2)"}
                    strokeWidth={selected ? 2.5 : 1.4}
                    onClick={() => setSel(s.id)}
                  />
                  <text
                    textAnchor="middle"
                    y={5}
                    fill={isOwned ? "#08090d" : isAvail ? "#e8eaef" : "#5c6170"}
                    fontSize="11"
                    fontFamily="Oxanium, sans-serif"
                    fontWeight="600"
                    pointerEvents="none"
                  >
                    {s.id === "core" ? "CORE" : s.cost}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        <footer className="flex flex-col gap-3 border-t border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="font-display text-base font-semibold">{def.name}</p>
            <p className="text-sm text-muted">{def.desc}</p>
          </div>
          <Button
            disabled={!canBuy}
            onClick={() => {
              api?.buySkill(sel);
            }}
          >
            {owned.has(sel) ? "Online" : canBuy ? `Forge · ${def.cost}` : def.cost === 0 ? "Core" : "Locked"}
          </Button>
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
  const show = phase === "playing" || phase === "paused" || phase === "skills" || phase === "gameover";
  if (!show) return null;
  const hpPct = hud.maxHp ? (hud.hp / hud.maxHp) * 100 : 0;
  const shPct = hud.maxShield ? (hud.shield / hud.maxShield) * 100 : 0;
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="rounded-[16px] border border-border bg-bg/55 px-3 py-2 backdrop-blur-sm">
          <p className="font-display text-[0.65rem] uppercase tracking-[0.2em] text-muted">Score</p>
          <p className="font-mono text-xl tabular-nums text-fg">{hud.score.toLocaleString()}</p>
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
          <p className="rounded-[16px] border border-border bg-bg/55 px-3 py-2 font-mono text-sm tabular-nums text-fg backdrop-blur-sm">
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

function DualSticks() {
  const layerRef = useRef<HTMLDivElement>(null);
  const moveRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const aimRef = useRef<{ id: number; ox: number; oy: number } | null>(null);
  const [moveKnob, setMoveKnob] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const [aimKnob, setAimKnob] = useState<{ ox: number; oy: number; x: number; y: number } | null>(null);
  const R = 56;

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

  const sideFor = (clientX: number) => {
    const el = layerRef.current;
    if (!el) return "left" as const;
    const rect = el.getBoundingClientRect();
    return clientX < rect.left + rect.width / 2 ? ("left" as const) : ("right" as const);
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

  return (
    <div
      ref={layerRef}
      className="pointer-events-auto absolute inset-x-0 bottom-0 top-[36%] z-20 touch-none"
      onPointerDown={(e) => {
        if (e.pointerType === "mouse") return;
        const side = sideFor(e.clientX);
        const slot = side === "left" ? moveRef : aimRef;
        if (slot.current) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        slot.current = { id: e.pointerId, ox: e.clientX, oy: e.clientY };
        const k = vec(e.clientX, e.clientY, e.clientX, e.clientY);
        if (side === "left") {
          setMoveKnob({ ox: e.clientX, oy: e.clientY, x: k.x, y: k.y });
          gameInput?.setTouchMove(0, 0, true);
        } else {
          setAimKnob({ ox: e.clientX, oy: e.clientY, x: k.x, y: k.y });
          gameInput?.setTouchAim(0, 0, true);
        }
      }}
      onPointerMove={(e) => {
        const apply = (
          slot: { id: number; ox: number; oy: number },
          set: typeof setMoveKnob,
          send: (x: number, y: number, on: boolean) => void,
        ) => {
          if (slot.id !== e.pointerId) return;
          const k = vec(slot.ox, slot.oy, e.clientX, e.clientY);
          set({ ox: slot.ox, oy: slot.oy, x: k.x, y: k.y });
          send(k.x / R, k.y / R, true);
        };
        if (moveRef.current) apply(moveRef.current, setMoveKnob, (x, y, on) => gameInput?.setTouchMove(x, y, on));
        if (aimRef.current) apply(aimRef.current, setAimKnob, (x, y, on) => gameInput?.setTouchAim(x, y, on));
      }}
      onPointerUp={(e) => release(e.pointerId)}
      onPointerCancel={(e) => release(e.pointerId)}
    >
      <p className="pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-6 font-display text-[10px] uppercase tracking-[0.2em] text-muted">
        Move
      </p>
      <p className="pointer-events-none absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] right-6 font-display text-[10px] uppercase tracking-[0.2em] text-muted">
        Aim
      </p>
      {moveKnob ? <StickGhost knob={moveKnob} r={R} /> : null}
      {aimKnob ? <StickGhost knob={aimKnob} r={R} /> : null}
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
      className="pointer-events-none fixed z-20 size-32 -translate-x-1/2 -translate-y-1/2"
      style={{ left: knob.ox, top: knob.oy, width: r * 2, height: r * 2 }}
    >
      <div className="absolute inset-0 rounded-full border border-border bg-surface/45" />
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

  useEffect(() => {
    if (!playing) {
      gameInput?.setTouchMove(0, 0, false);
      gameInput?.setTouchAim(0, 0, false);
    }
  }, [playing]);

  if (!playing) return null;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 [@media(hover:hover)_and_(pointer:fine)]:hidden">
      <DualSticks />
    </div>
  );
}
