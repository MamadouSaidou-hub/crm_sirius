"use client";

import { useCallback, useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

function detectStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const iosStandalone = (
    window.navigator as Navigator & { standalone?: boolean }
  ).standalone;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    iosStandalone === true
  );
}

function detectIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !("MSStream" in window)
  );
}

/**
 * True only when running in real Safari on iOS — the only browser where
 * Add-to-Home-Screen works. Chrome/Firefox/Edge on iOS and in-app webviews
 * (WhatsApp, Instagram, Facebook…) cannot install.
 */
function detectIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  if (!/iphone|ipad|ipod/i.test(ua)) return false;
  const blocked =
    /crios|fxios|edgios|opios|gsa|fban|fbav|instagram|line\/|whatsapp|micromessenger/i;
  return /safari/i.test(ua) && !blocked.test(ua);
}

export interface PwaInstall {
  /** Native install prompt is available (Android / Chromium desktop). */
  canInstall: boolean;
  /** iOS device (any browser), not already installed. */
  isIOS: boolean;
  /** Real Safari on iOS — where Add-to-Home-Screen actually works. */
  isIOSSafari: boolean;
  /** Already running as an installed app. */
  isStandalone: boolean;
  /** Trigger the native install dialog. Returns the user's choice. */
  promptInstall: () => Promise<"accepted" | "dismissed" | "unavailable">;
}

/**
 * Wraps the PWA install flow: captures `beforeinstallprompt` (Android/desktop),
 * detects iOS (manual add-to-home-screen) and the already-installed state.
 */
export function usePwaInstall(): PwaInstall {
  const [deferred, setDeferred] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isIOSSafari, setIsIOSSafari] = useState(false);

  useEffect(() => {
    setIsStandalone(detectStandalone());
    setIsIOS(detectIOS());
    setIsIOSSafari(detectIOSSafari());

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setIsStandalone(true);
    };

    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferred) return "unavailable" as const;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null);
    if (outcome === "accepted") setIsStandalone(true);
    return outcome;
  }, [deferred]);

  return {
    canInstall: deferred !== null && !isStandalone,
    isIOS: isIOS && !isStandalone,
    isIOSSafari: isIOSSafari && !isStandalone,
    isStandalone,
    promptInstall,
  };
}
