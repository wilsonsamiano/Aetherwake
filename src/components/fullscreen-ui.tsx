import { useEffect, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { enterFullscreen, exitFullscreen, isFullscreen, subscribeFullscreen } from "@/lib/fullscreen";

function useFullscreenFlag() {
  const [on, setOn] = useState(() => (typeof document === "undefined" ? false : isFullscreen()));
  useEffect(() => subscribeFullscreen(() => setOn(isFullscreen())), []);
  return on;
}

export function FullscreenButtons({ labeled = false, className }: { labeled?: boolean; className?: string }) {
  const on = useFullscreenFlag();
  return (
    <button
      type="button"
      aria-label={on ? "Exit full screen" : "Full screen"}
      className={cn(
        "pointer-events-auto place-items-center rounded-[12px] border border-border bg-surface/80 text-fg",
        labeled
          ? "inline-flex h-11 w-full items-center justify-center gap-2 px-3 font-display text-sm"
          : "grid size-11",
        on && "border-fg/40",
        className,
      )}
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (on) exitFullscreen();
        else enterFullscreen();
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {on ? <X className="size-4" /> : <Maximize2 className="size-4" />}
      {labeled ? <span>{on ? "Esc" : "Full screen"}</span> : null}
    </button>
  );
}
