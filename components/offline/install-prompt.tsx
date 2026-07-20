"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";
import { usePwaInstall } from "@/lib/offline/use-pwa-install";

const DISMISS_KEY = "sirius_install_dismissed";

/**
 * Discreet, dismissible bar inviting the user to install the app. Shows a native
 * "Installer" button on Android/desktop, or add-to-home-screen instructions on
 * iOS. Hidden when already installed or once dismissed.
 */
export function InstallPrompt() {
  const { canInstall, isIOS, isIOSSafari, promptInstall } = usePwaInstall();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  };

  if (dismissed || (!canInstall && !isIOS)) return null;

  return (
    <div className="flex items-center gap-3 border-b border-sirius-gold/20 bg-sirius-gold/10 px-4 py-2 text-xs text-sirius-gold md:px-6">
      {canInstall ? (
        <>
          <Download className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1 truncate">
            Installez Sirius CRM sur votre appareil pour un accès rapide et
            hors-ligne.
          </span>
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="shrink-0 rounded-md bg-sirius-gold px-2.5 py-1 font-semibold text-sirius-ink transition-opacity hover:opacity-90"
          >
            Installer
          </button>
        </>
      ) : isIOSSafari ? (
        <>
          <Share className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">
            Pour installer : appuyez sur le bouton{" "}
            <span className="font-semibold">Partager</span> de Safari (en bas,
            carré + flèche ↑) puis{" "}
            <span className="font-semibold">
              « Sur l&apos;écran d&apos;accueil »
            </span>
            .
          </span>
        </>
      ) : (
        <>
          <Share className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">
            Ouvrez ce lien dans <span className="font-semibold">Safari</span>{" "}
            pour installer l&apos;app (l&apos;installation iPhone ne marche que
            dans Safari).
          </span>
        </>
      )}
      <button
        type="button"
        onClick={dismiss}
        aria-label="Fermer"
        className="shrink-0 rounded p-1 hover:bg-sirius-gold/20"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
