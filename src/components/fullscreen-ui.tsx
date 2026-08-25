import { useEffect, useRef, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { enterFullscreen, exitFullscreen, isFullscreen, subscribeFullscreen } from "@/lib/fullscreen";

function useFullscreenFlag() {
  const [on, setOn] = useState(() => (typeof document === "undefined" ? false : isFullscreen()));
  useEffect(() => subscribeFullscreen(() => setOn(isFullscreen())), []);
  return on;
}

function toggleFullscreen() {
  if (isFullscreen()) exitFullscreen();
  else enterFullscreen();
}

export function FullscreenButtons({ labeled = false, className }: { labeled?: boolean; className?: string }) {
  const on = useFullscreenFlag();
  const last = useRef(0);
  const toggle = () => {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - last.current < 400) return;
    last.current = now;
    toggleFullscreen();
  };
  return (
    <button
      type="button"
      aria-label={on ? "Exit full screen" : "Full screen"}
      aria-pressed={on}
      className={cn(
        "pointer-events-auto place-items-center rounded-[12px] border border-border bg-surface/80 text-fg",
        labeled
          ? "inline-flex h-12 w-full items-center justify-center gap-2 px-3 font-display text-base sm:h-11 sm:text-sm"
          : "grid size-11",
        on && "border-fg/50 bg-elevated",
        className,
      )}
      onPointerDown={(e) => {
        e.stopPropagation();
        toggle();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle();
      }}
    >
      {on ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
      {labeled ? <span>{on ? "Exit fullscreen" : "Full screen"}</span> : null}
    </button>
  );
}
