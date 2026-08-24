export let gameInput: Input | null = null;

export type InputState = {
  moveX: number;
  moveY: number;
  /** Right-stick / right-touch aim direction, canvas space (+y down). 0 if idle. */
  aimSX: number;
  aimSY: number;
  pointerX: number;
  pointerY: number;
  hasPointer: boolean;
  usingPad: boolean;
  usingTouch: boolean;
  fire: boolean;
  dash: boolean;
  pause: boolean;
  confirm: boolean;
};

const GAME_KEYS = new Set([
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
  "Enter",
]);

function radial(x: number, y: number, dz = 0.18) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0, m: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale, m };
}

type AimSource = "none" | "pointer" | "pad" | "touch";

export class Input {
  keys = new Set<string>();
  injected = new Set<string>();
  pointer = { x: 0, y: 0, moved: false };
  touchMove = { active: false, x: 0, y: 0 };
  touchAim = { active: false, x: 0, y: 0 };
  canvas: HTMLCanvasElement | null = null;
  padLive = false;
  private aimSource: AimSource = "none";
  private pauseQueued = false;
  private dashQueued = false;
  private confirmQueued = false;
  private prevPause = false;
  private prevDash = false;
  private prevConfirm = false;
  private prevPadPause = false;
  private prevPadDash = false;
  private prevPadConfirm = false;
  onPad?: (connected: boolean) => void;

  attach(canvas: HTMLCanvasElement) {
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

  setTouchMove(x: number, y: number, active: boolean) {
    this.touchMove = { active, x, y };
  }

  setTouchAim(x: number, y: number, active: boolean) {
    this.touchAim = { active, x, y };
    if (active) this.aimSource = "touch";
  }

  setKeys(codes: string[]) {
    this.injected = new Set(codes);
  }

  /** Drop mouse aim so a menu click doesn't yank the nose. */
  clearPointerAim() {
    this.pointer.moved = false;
    this.aimSource = "none";
  }

  clientToWorld(clientX: number, clientY: number): { x: number; y: number } {
    const c = this.canvas;
    if (!c) return { x: 0, y: 0 };
    const r = c.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * c.width;
    const y = ((clientY - r.top) / r.height) * c.height;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return { x: x / dpr, y: y / dpr };
  }

  sample(): InputState {
    const keys = new Set([...this.keys, ...this.injected]);
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
    const pauseEdge = (pauseHeld && !this.prevPause) || (pad.pause && !this.prevPadPause) || this.pauseQueued;
    this.prevPause = pauseHeld;
    this.prevPadPause = pad.pause;
    this.pauseQueued = false;

    const dashHeld = keys.has("ShiftLeft") || keys.has("ShiftRight") || keys.has("Space") || this.dashQueued;
    const dashEdge = (dashHeld && !this.prevDash) || (pad.dash && !this.prevPadDash) || this.dashQueued;
    this.prevDash = dashHeld;
    this.prevPadDash = pad.dash;
    this.dashQueued = false;

    const confirmHeld = keys.has("Enter") || this.confirmQueued;
    const confirmEdge = (confirmHeld && !this.prevConfirm) || (pad.confirm && !this.prevPadConfirm) || this.confirmQueued;
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
      confirm: confirmEdge,
    };
  }

  rumble(strong = 0.4, weak = 0.6, ms = 80) {
    if (typeof navigator === "undefined" || !navigator.getGamepads) return;
    for (const p of navigator.getGamepads()) {
      const act = p?.vibrationActuator;
      if (!act) continue;
      void act.playEffect("dual-rumble", {
        startDelay: 0,
        duration: ms,
        strongMagnitude: strong,
        weakMagnitude: weak,
      }).catch(() => {});
    }
  }

  private readPad() {
    const empty = {
      mx: 0, my: 0, ax: 0, ay: 0, aiming: false, fire: false, dash: false, pause: false, confirm: false, active: false, connected: false,
    };
    if (typeof navigator === "undefined" || !navigator.getGamepads) return empty;
    const pads = [...navigator.getGamepads()].filter((p): p is Gamepad => !!p && p.axes.length >= 2);
    const p = pads.find((g) => g.mapping === "standard") ?? pads[0];
    if (!p) return empty;
    const l = radial(p.axes[0] ?? 0, p.axes[1] ?? 0);
    const r = p.axes.length >= 4 ? radial(p.axes[2] ?? 0, p.axes[3] ?? 0, 0.22) : { x: 0, y: 0, m: 0 };
    const b = (i: number) => !!p.buttons[i]?.pressed;
    const v = (i: number) => p.buttons[i]?.value ?? 0;
    let mx = l.x;
    let my = l.y;
    if (b(14)) mx -= 1;
    if (b(15)) mx += 1;
    if (b(12)) my -= 1;
    if (b(13)) my += 1;
    const fire = b(7) || b(0) || v(7) > 0.35 || r.m > 0.25;
    const dash = b(4) || b(5) || b(6) || v(6) > 0.6;
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
      connected: true,
    };
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (GAME_KEYS.has(e.code)) e.preventDefault();
    this.keys.add(e.code);
    if (e.code === "Escape" || e.code === "KeyP") this.pauseQueued = true;
    if (e.code === "ShiftLeft" || e.code === "ShiftRight" || e.code === "Space") this.dashQueued = true;
    if (e.code === "Enter") this.confirmQueued = true;
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private clearKeys = () => {
    this.keys.clear();
  };
  private onVis = () => {
    if (document.hidden) this.clearKeys();
  };
  private onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const w = this.clientToWorld(e.clientX, e.clientY);
    this.pointer.x = w.x;
    this.pointer.y = w.y;
    this.pointer.moved = true;
    this.aimSource = "pointer";
  };
  private onPadOn = () => {
    this.padLive = true;
    this.onPad?.(true);
  };
  private onPadOff = () => {
    this.padLive = false;
    if (this.aimSource === "pad") this.aimSource = "none";
    this.onPad?.(false);
  };
}
