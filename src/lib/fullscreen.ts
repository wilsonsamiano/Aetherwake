const FS_CLASS = "awake-fs";

let wantFs = false;
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

function hasNativeFs() {
  return !!(document.fullscreenElement || (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement);
}

export function isFullscreen() {
  return wantFs || document.documentElement.classList.contains(FS_CLASS) || hasNativeFs();
}

export function subscribeFullscreen(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function applyClass(on: boolean) {
  document.documentElement.classList.toggle(FS_CLASS, on);
  document.body?.classList.toggle(FS_CLASS, on);
}

export function enterFullscreen() {
  wantFs = true;
  applyClass(true);
  notify();
  const root =
    document.querySelector<HTMLElement>("[data-game-root]") ?? document.documentElement;
  const req =
    root.requestFullscreen?.bind(root) ||
    (root as HTMLElement & { webkitRequestFullscreen?: () => void }).webkitRequestFullscreen?.bind(root) ||
    document.documentElement.requestFullscreen?.bind(document.documentElement);
  try {
    const p = req?.({ navigationUI: "hide" } as FullscreenOptions);
    if (p && typeof (p as Promise<void>).catch === "function") {
      (p as Promise<void>).catch(() => {
        /* iOS / iframe often rejects; CSS class still applies */
      });
    }
  } catch {
    /* keep CSS fallback */
  }
}

export function exitFullscreen() {
  wantFs = false;
  applyClass(false);
  notify();
  try {
    if (document.exitFullscreen) void document.exitFullscreen().catch(() => {});
    const webkitExit = (document as Document & { webkitExitFullscreen?: () => void }).webkitExitFullscreen;
    webkitExit?.call(document);
  } catch {
    /* ignore */
  }
}

if (typeof document !== "undefined") {
  const onChange = () => {
    if (!hasNativeFs() && !wantFs) applyClass(false);
    if (hasNativeFs()) {
      wantFs = true;
      applyClass(true);
    }
    notify();
  };
  document.addEventListener("fullscreenchange", onChange);
  document.addEventListener("webkitfullscreenchange", onChange as EventListener);
}
