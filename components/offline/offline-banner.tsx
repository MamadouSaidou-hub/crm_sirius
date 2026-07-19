"use client";

import { CloudOff, Loader2, RefreshCw } from "lucide-react";
import { useSync } from "@/lib/offline/sync-provider";
import { cn } from "@/lib/utils";

/**
 * Thin status bar shown under the topbar when the app is offline or has
 * operations waiting to sync. Hidden entirely when online with an empty queue.
 */
export function OfflineBanner() {
  const { online, pending, syncing, syncNow } = useSync();

  if (online && pending === 0) return null;

  const label = !online
    ? pending > 0
      ? `Hors-ligne · ${pending} en attente d'envoi`
      : "Hors-ligne · vos saisies seront synchronisées au retour du réseau"
    : syncing
      ? "Synchronisation en cours…"
      : `${pending} en attente d'envoi`;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium md:px-6",
        online
          ? "bg-sirius-teal/10 text-sirius-teal"
          : "bg-sirius-warning/10 text-sirius-warning",
      )}
    >
      <span className="flex min-w-0 items-center gap-2">
        {!online ? (
          <CloudOff className="h-4 w-4 shrink-0" />
        ) : syncing ? (
          <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4 shrink-0" />
        )}
        <span className="truncate">{label}</span>
      </span>

      {online && pending > 0 && !syncing && (
        <button
          type="button"
          onClick={() => void syncNow()}
          className="shrink-0 rounded-md bg-sirius-teal/20 px-2 py-1 font-semibold text-sirius-teal transition-colors hover:bg-sirius-teal/30"
        >
          Synchroniser
        </button>
      )}
    </div>
  );
}
