import { createClient } from "@/lib/supabase/client";
import type { User, UserRole } from "@/lib/types";
import { PROFILE_COLS, mapProfile, type ProfileRow } from "@/lib/data/profiles";

export interface UserWithManager extends User {
  managerName: string | null;
}

interface Row extends ProfileRow {
  manager: { name: string } | { name: string }[] | null;
}

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const COLS = `${PROFILE_COLS},manager:profiles!manager_id(name)`;

function mapUser(r: Row): UserWithManager {
  return { ...mapProfile(r), managerName: firstOf(r.manager)?.name ?? null };
}

/** Team members visible to the current user (admin → all, manager → team+self). */
export async function fetchUsers(current: User): Promise<UserWithManager[]> {
  const supabase = createClient();
  let query = supabase.from("profiles").select(COLS);
  if (current.role === "manager") {
    query = query.or(`manager_id.eq.${current.id},id.eq.${current.id}`);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((r) => mapUser(r as unknown as Row));
}

export async function setUserActive(
  id: string,
  active: boolean,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ active })
    .eq("id", id);
  if (error) throw error;
}

export interface UserProfilePatch {
  name: string;
  role: UserRole;
  managerId: string | null;
  agency: string;
  phone: string;
}

export async function updateUserProfile(
  id: string,
  patch: UserProfilePatch,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      name: patch.name,
      role: patch.role,
      manager_id: patch.role === "commercial" ? patch.managerId || null : null,
      agency: patch.agency || null,
      phone: patch.phone || null,
    })
    .eq("id", id);
  if (error) throw error;
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  managerId: string;
  agency: string;
  phone: string;
}

/** Create a user via the admin server route (service_role). */
export async function createUser(input: CreateUserInput): Promise<void> {
  const res = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) {
    throw new Error(data.error ?? "create_failed");
  }
}
