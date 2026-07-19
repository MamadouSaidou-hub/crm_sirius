"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { User, UserRole } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { isNetworkError, isOnline } from "@/lib/offline/net";
import {
  clearCachedProfile,
  readCachedProfile,
  writeCachedProfile,
} from "@/lib/offline/session-cache";

/**
 * Real authentication context, backed by Supabase.
 *
 * (Kept the `useMockUser` / `MockUserProvider` names to avoid a wide rename;
 * they now expose the signed-in user's profile rather than a mock.)
 */
interface AuthContextValue {
  user: User;
  role: UserRole;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

interface ProfileRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  manager_id: string | null;
  agency: string | null;
  active: boolean;
  last_login_at: string | null;
}

function toUser(row: ProfileRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? "",
    role: row.role,
    managerId: row.manager_id,
    agency: row.agency ?? "",
    active: row.active,
    lastLoginAt: row.last_login_at,
  };
}

export function MockUserProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = React.useMemo(() => createClient(), []);
  const [user, setUser] = React.useState<User | null>(null);

  React.useEffect(() => {
    let active = true;

    // Instant paint: show the cached profile immediately (no network), so
    // returning users skip the auth spinner and offline reopens still work.
    const cached = readCachedProfile();
    if (cached && active) setUser(cached);

    async function reconcile() {
      const {
        data: { user: authUser },
        error,
      } = await supabase.auth.getUser();

      // Server-validated session: refresh the profile and cache it.
      if (authUser) {
        const { data } = await supabase
          .from("profiles")
          .select(
            "id,name,email,phone,role,manager_id,agency,active,last_login_at",
          )
          .eq("id", authUser.id)
          .single();
        if (data) {
          const fresh = toUser(data as ProfileRow);
          writeCachedProfile(fresh);
          if (active) setUser(fresh);
        } else if (!cached) {
          router.replace("/login");
        }
        return;
      }

      // No validated user. If we're merely offline and hold a cached profile
      // (i.e. we DID log in successfully before), stay signed in on the cache.
      if (!isOnline() || isNetworkError(error)) {
        if (!cached) router.replace("/login");
        return;
      }

      // Online and genuinely unauthenticated: drop the cache and sign out.
      clearCachedProfile();
      router.replace("/login");
    }

    reconcile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        clearCachedProfile();
        router.replace("/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = React.useCallback(async () => {
    clearCachedProfile();
    await supabase.auth.signOut();
    router.replace("/login");
  }, [supabase, router]);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-sirius-navy">
        <Loader2 className="h-6 w-6 animate-spin text-sirius-gold" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, role: user.role, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Access the signed-in user, role and sign-out action. */
export function useMockUser(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useMockUser must be used within a MockUserProvider");
  }
  return ctx;
}
