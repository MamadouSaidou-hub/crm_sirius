import { offlineDb } from "./db";

/** Persist a read result so it can be served while offline. */
export async function writeCache(key: string, value: unknown): Promise<void> {
  await offlineDb.cache.put({
    key,
    value,
    updatedAt: new Date().toISOString(),
  });
}

export async function readCache<T>(key: string): Promise<T | null> {
  const entry = await offlineDb.cache.get(key);
  return entry ? (entry.value as T) : null;
}
