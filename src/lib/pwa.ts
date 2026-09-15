import { createContext, createElement, useContext, useEffect, useState, type ReactNode } from "react";

const DISMISS_KEY = "s1s2-pwa-banner";

type BIPEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type PwaState = {
  standalone: boolean;
  ios: boolean;
  canInstall: boolean;
  dismissed: boolean;
  offline: boolean;
  updateReady: boolean;
  install: () => Promise<void>;
  dismiss: () => void;
  applyUpdate: () => void;
};

function readStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: window-controls-overlay)").matches ||
    Boolean((navigator as Navigator & { standalone?: boolean }).standalone)
  );
}

function readIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return (
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

export function isStandalone() {
  return readStandalone();
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator)) return;
  const base = import.meta.env.BASE_URL;
  const go = () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {
      /* ignore — private mode / insecure context */
    });
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

function usePwaState(): PwaState {
  const [standalone, setStandalone] = useState(false);
  const [ios, setIos] = useState(false);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [offline, setOffline] = useState(false);
  const [updateReady, setUpdateReady] = useState(false);

  useEffect(() => {
    registerServiceWorker();
    setStandalone(readStandalone());
    setIos(readIos());
    setOffline(!navigator.onLine);
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      /* ignore */
    }

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setStandalone(true);
    };
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);
    const onMode = () => setStandalone(readStandalone());

    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    const mq = window.matchMedia("(display-mode: standalone)");
    mq.addEventListener?.("change", onMode);

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistration().then((reg) => {
        if (!reg) return;
        if (reg.waiting) setUpdateReady(true);
        reg.addEventListener("updatefound", () => {
          const w = reg.installing;
          w?.addEventListener("statechange", () => {
            if (w.state === "installed" && navigator.serviceWorker.controller) {
              setUpdateReady(true);
            }
          });
        });
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      mq.removeEventListener?.("change", onMode);
    };
  }, []);

  return {
    standalone,
    ios,
    canInstall: Boolean(deferred) && !standalone,
    dismissed,
    offline,
    updateReady,
    install: async () => {
      if (!deferred) return;
      await deferred.prompt();
      const choice = await deferred.userChoice;
      setDeferred(null);
      if (choice.outcome === "accepted") setStandalone(true);
    },
    dismiss: () => {
      try {
        localStorage.setItem(DISMISS_KEY, "1");
      } catch {
        /* ignore */
      }
      setDismissed(true);
    },
    applyUpdate: () => {
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker.getRegistration().then((reg) => {
        reg?.waiting?.postMessage("skipWaiting");
        window.location.reload();
      });
    },
  };
}

const PwaContext = createContext<PwaState | null>(null);

export function PwaProvider({ children }: { children: ReactNode }) {
  const value = usePwaState();
  return createElement(PwaContext.Provider, { value }, children);
}

export function usePwa(): PwaState {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error("usePwa must be used within PwaProvider");
  }
  return ctx;
}
