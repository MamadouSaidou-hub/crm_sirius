"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { isOnline, subscribeOnline } from "./net";
import { OUTBOX_EVENT, flush, pendingCount } from "./outbox";

interface SyncState {
  online: boolean;
  /** Number of operations waiting to be sent. */
  pending: number;
  syncing: boolean;
  lastSyncAt: string | null;
  /** Flush the queue now (no-op when offline). */
  syncNow: () => Promise<void>;
}

const SyncContext = createContext<SyncState | null>(null);

export function useSync(): SyncState {
  const value = useContext(SyncContext);
  if (!value) throw new Error("useSync must be used within SyncProvider");
  return value;
}

const LAST_SYNC_KEY = "sirius_last_sync";

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);

  const refresh = useCallback(() => {
    pendingCount()
      .then(setPending)
      .catch(() => {});
  }, []);

  const syncNow = useCallback(async () => {
    if (!isOnline()) return;
    setSyncing(true);
    try {
      const res = await flush();
      if (res.sent > 0) {
        const now = new Date().toISOString();
        localStorage.setItem(LAST_SYNC_KEY, now);
        setLastSyncAt(now);
      }
    } finally {
      setSyncing(false);
      refresh();
    }
  }, [refresh]);

  useEffect(() => {
    setOnline(isOnline());
    setLastSyncAt(localStorage.getItem(LAST_SYNC_KEY));
    refresh();

    const unsub = subscribeOnline((o) => {
      setOnline(o);
      if (o) void syncNow();
    });
    const onOutbox = () => refresh();
    window.addEventListener(OUTBOX_EVENT, onOutbox);

    // Attempt a flush on load in case items were left from a previous session.
    if (isOnline()) void syncNow();

    return () => {
      unsub();
      window.removeEventListener(OUTBOX_EVENT, onOutbox);
    };
  }, [refresh, syncNow]);

  return (
    <SyncContext.Provider
      value={{ online, pending, syncing, lastSyncAt, syncNow }}
    >
      {children}
    </SyncContext.Provider>
  );
}
