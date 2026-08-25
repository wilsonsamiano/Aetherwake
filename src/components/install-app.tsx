import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    Boolean((window.navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function isIos() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function registerAetherwakeWorker() {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  if (window.parent !== window) return;
  const host = window.location.hostname;
  if (host === "127.0.0.1" || host === "localhost") return;
  void navigator.serviceWorker.register("/sw.js").catch(() => {});
}

export function InstallApp({ className }: { className?: string }) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    registerAetherwakeWorker();
    setInstalled(isStandalone());
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  if (deferred) {
    return (
      <Button
        variant="ghost"
        className={className}
        onClick={async () => {
          await deferred.prompt();
          const choice = await deferred.userChoice;
          if (choice.outcome === "accepted") setInstalled(true);
          setDeferred(null);
        }}
      >
        <Download className="size-4" />
        Install app
      </Button>
    );
  }

  if (isIos()) {
    return (
      <div className={className}>
        <Button variant="ghost" className="w-full" onClick={() => setIosHint((v) => !v)}>
          <Share className="size-4" />
          Add to Home Screen
        </Button>
        {iosHint ? (
          <p className="mt-2 text-center text-sm leading-snug text-muted">
            Tap Share, then Add to Home Screen. Aetherwake opens like an app, no browser chrome.
          </p>
        ) : null}
      </div>
    );
  }

  return null;
}
