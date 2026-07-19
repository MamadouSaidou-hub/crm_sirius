import Dexie, { type Table } from "dexie";
import type { OutboxItem } from "./types";

/** Generic key/value cache used to serve read lists while offline. */
export interface CacheEntry {
  key: string;
  value: unknown;
  updatedAt: string;
}

/**
 * Browser-only IndexedDB store. Construction is safe on the server (Dexie only
 * touches indexedDB on the first query), but every query path runs in client
 * components / effects.
 */
class OfflineDB extends Dexie {
  outbox!: Table<OutboxItem, string>;
  cache!: Table<CacheEntry, string>;

  constructor() {
    super("sirius_offline");
    this.version(1).stores({
      outbox: "id, createdAt",
      cache: "key, updatedAt",
    });
  }
}

export const offlineDb = new OfflineDB();
