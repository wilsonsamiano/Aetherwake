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

function applyClass(on: boolean) {
  document.documentElement.classList.toggle(FS_CLASS, on);
  document.body?.classList.toggle(FS_CLASS, on);
}

function markExited() {
  wantFs = false;
  nativeOn = false;
  exitedAt = typeof performance !== "undefined" ? performance.now() : 0;
  applyClass(false);
  notify();
}

export function enterFullscreen() {
  wantFs = true;
  applyClass(true);
  notify();

  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => void;
    webkitRequestFullScreen?: () => void;
  };
  try {
    if (typeof el.requestFullscreen === "function") {
      const p = el.requestFullscreen({ navigationUI: "hide" });
      void p.catch(() => {
        /* iframe / iOS: keep CSS fallback */
      });
      return;
    }
    el.webkitRequestFullscreen?.();
    el.webkitRequestFullScreen?.();
  } catch {
    /* keep CSS fallback */
  }
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
      notify();
      return;
    }
    // Native FS is off. A bounce/reject must not undo CSS fill.
    if (nativeOn) {
      nativeOn = false;
      const dur = typeof performance !== "undefined" ? performance.now() - nativeSince : 9999;
      if (wantFs && dur < 400) {
        applyClass(true);
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
