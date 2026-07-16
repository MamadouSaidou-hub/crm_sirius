import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/lib/types";

/** Shape of a `profiles` row as returned by Supabase (snake_case). */
export interface ProfileRow {
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

export const PROFILE_COLS =
  "id,name,email,phone,role,manager_id,agency,active,last_login_at";

export function mapProfile(row: ProfileRow): User {
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

/**
 * Commercials the current user may assign work to / filter by:
 * admin → all, manager → their team, commercial → themselves.
 * (Profiles are readable by everyone via RLS, so we scope here explicitly.)
 */
export async function fetchAssignableCommercials(
  current: User,
): Promise<User[]> {
  const supabase = createClient();
  let query = supabase
    .from("profiles")
    .select(PROFILE_COLS)
    .eq("role", "commercial");

  if (current.role === "manager") query = query.eq("manager_id", current.id);
  else if (current.role === "commercial") query = query.eq("id", current.id);

  const { data, error } = await query.order("name");
  if (error) throw error;
  return (data ?? []).map((r) => mapProfile(r as ProfileRow));
}
