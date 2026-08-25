const FS_CLASS = "awake-fs";

let wantFs = false;
let nativeOn = false;
let nativeSince = 0;
let exitedAt = 0;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

function hasNativeFs() {
  const doc = document as Document & { webkitFullscreenElement?: Element | null };
  return !!(document.fullscreenElement || doc.webkitFullscreenElement);
}

export function isFullscreen() {
  return wantFs || document.documentElement.classList.contains(FS_CLASS) || hasNativeFs();
}

export function justExitedFullscreen(ms = 450) {
  return typeof performance !== "undefined" && performance.now() - exitedAt < ms;
}

export function subscribeFullscreen(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function nativeFullscreenAvailable() {
  if (typeof document === "undefined") return false;
  const el = document.documentElement as HTMLElement & {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => void;
  };
  return typeof el.requestFullscreen === "function" || typeof el.webkitRequestFullscreen === "function";
}

function applyClass(on: boolean) {
  document.documentElement.classList.toggle(FS_CLASS, on);
  document.body?.classList.toggle(FS_CLASS, on);
}

function setViewportVar() {
  if (typeof window === "undefined") return;
  const h = window.visualViewport?.height ?? window.innerHeight;
  document.documentElement.style.setProperty("--aw-vh", `${Math.round(h)}px`);
}

function onViewportResize() {
  if (wantFs) setViewportVar();
}

function bindViewport(on: boolean) {
  const vv = typeof window !== "undefined" ? window.visualViewport : null;
  if (!vv) return;
  vv.removeEventListener("resize", onViewportResize);
  vv.removeEventListener("scroll", onViewportResize);
  if (on) {
    vv.addEventListener("resize", onViewportResize);
    vv.addEventListener("scroll", onViewportResize);
    setViewportVar();
  } else {
    document.documentElement.style.removeProperty("--aw-vh");
  }
}

function hideMobileChrome() {
  if (typeof window === "undefined") return;
  setViewportVar();
  try {
    const body = document.body;
    const prev = body.style.height;
    body.style.height = `${window.innerHeight + 120}px`;
    window.scrollTo(0, 120);
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
      body.style.height = prev;
      setViewportVar();
    });
  } catch {
    /* ignore */
  }
}

function markExited() {
  wantFs = false;
  nativeOn = false;
  exitedAt = typeof performance !== "undefined" ? performance.now() : 0;
  applyClass(false);
  bindViewport(false);
  notify();
}

type FsEl = HTMLElement & {
  requestFullscreen?: (opts?: FullscreenOptions) => Promise<void>;
  webkitRequestFullscreen?: () => void;
  webkitRequestFullScreen?: () => void;
};

async function requestNativeFs() {
  const nodes: (Element | null)[] = [
    document.querySelector("[data-game-root]"),
    document.documentElement,
    document.body,
  ];
  for (const node of nodes) {
    if (!node) continue;
    const el = node as FsEl;
    if (typeof el.requestFullscreen === "function") {
      try {
        await el.requestFullscreen({ navigationUI: "hide" });
        return true;
      } catch {
        try {
          await el.requestFullscreen();
          return true;
        } catch {
          /* try next */
        }
      }
    }
    try {
      el.webkitRequestFullscreen?.();
      el.webkitRequestFullScreen?.();
      if (hasNativeFs()) return true;
    } catch {
      /* try next */
    }
  }
  return false;
}

export function enterFullscreen() {
  wantFs = true;
  applyClass(true);
  bindViewport(true);
  hideMobileChrome();
  notify();
  void requestNativeFs();
}

export function exitFullscreen() {
  markExited();
  const doc = document as Document & { webkitExitFullscreen?: () => void; webkitCancelFullScreen?: () => void };
  try {
    if (document.exitFullscreen && document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
    }
    doc.webkitExitFullscreen?.();
    doc.webkitCancelFullScreen?.();
  } catch {
    /* ignore */
  }
}

if (typeof document !== "undefined") {
  const onChange = () => {
    if (hasNativeFs()) {
      nativeOn = true;
      nativeSince = typeof performance !== "undefined" ? performance.now() : 0;
      wantFs = true;
      applyClass(true);
      bindViewport(true);
      notify();
      return;
    }
    if (nativeOn) {
      nativeOn = false;
      const dur = typeof performance !== "undefined" ? performance.now() - nativeSince : 9999;
      if (wantFs && dur < 400) {
        applyClass(true);
        bindViewport(true);
        notify();
        return;
      }
      markExited();
      return;
    }
    notify();
  };
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange as EventListener);
  document.addEventListener("fullscreenerror", () => notify());
  document.addEventListener("webkitfullscreenerror", () => notify());
}
