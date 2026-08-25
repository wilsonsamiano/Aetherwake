import { useEffect, useState } from "react";
import { Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  enterFullscreen,
  exitFullscreen,
  isFullscreen,
  subscribeFullscreen,
} from "@/lib/fullscreen";

function useFullscreenFlag() {
  const [on, setOn] = useState(() => (typeof document === "undefined" ? false : isFullscreen()));
  useEffect(() => subscribeFullscreen(() => setOn(isFullscreen())), []);
  return on;
}

function isIosPhone() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipod/i.test(navigator.userAgent);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

export function FullscreenButtons({ labeled = false, className }: { labeled?: boolean; className?: string }) {
  const on = useFullscreenFlag();
  const [hint, setHint] = useState(false);

  const toggle = () => {
    if (isFullscreen()) {
      exitFullscreen();
      setHint(false);
      return;
    }
    enterFullscreen();
    window.setTimeout(() => {
      const native = !!(
        document.fullscreenElement ||
        (document as Document & { webkitFullscreenElement?: Element }).webkitFullscreenElement
      );
      if (!native && isIosPhone() && !isStandalone()) {
        setHint(true);
      }
    }, 280);
  };

  const label = on ? "Exit fullscreen" : "Full screen";

  if (labeled) {
    return (
      <div className="w-full">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          className={cn("w-full touch-manipulation", on && "border-fg/50 bg-elevated", className)}
          aria-label={label}
          aria-pressed={on}
          onClick={toggle}
        >
          {on ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          {label}
        </Button>
        {hint ? (
          <p className="mt-2 text-center text-sm leading-snug text-muted">
            iPhone Safari cannot hide its toolbar. Tap Add to Home Screen, then open Aetherwake from your home screen for true full screen.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={on}
      className={cn(
        "pointer-events-auto grid size-11 place-items-center rounded-[12px] border border-border bg-surface/80 text-fg touch-manipulation",
        on && "border-fg/50 bg-elevated",
        className,
      )}
      onClick={toggle}
    >
      {on ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
    </button>
  );
}
