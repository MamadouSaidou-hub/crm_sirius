import type { User } from "@/lib/types";

/**
 * Local cache of the signed-in user's profile. Purely for instant paint and
 * offline continuity — it is NOT an authentication token and grants no access:
 * every database call still requires a valid Supabase session and passes RLS.
 * Written only after a server-validated login; cleared on sign-out.
 */
const KEY = "sirius_profile";

export function readCachedProfile(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function writeCachedProfile(user: User): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(user));
  } catch {
    /* storage full / disabled — non-fatal */
  }
}

export function clearCachedProfile(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* non-fatal */
  }
}
