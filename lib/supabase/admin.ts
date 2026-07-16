import { createClient } from "@supabase/supabase-js";

/**
 * Server-only Supabase client using the service_role key. Bypasses RLS and can
 * use the Auth admin API — NEVER import this into client code.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
