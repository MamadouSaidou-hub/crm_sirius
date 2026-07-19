import { createClient } from "@/lib/supabase/client";
import type {
  City,
  ProductType,
  Prospect,
  Stage,
  UserRole,
} from "@/lib/types";

/** A prospect enriched with its assignee's display name and role. */
export interface ProspectListItem extends Prospect {
  assigneeName: string;
  assigneeRole: UserRole | null;
}

interface ProspectRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  cni: string | null;
  address: string | null;
  city: string | null;
  products: ProductType[] | null;
  estimated_premium: number;
  stage: Stage;
  assigned_to: string;
  notes: string | null;
  lost_reason: string | null;
  created_at: string;
  last_activity_at: string;
  assignee:
    | { name: string; role: UserRole }
    | { name: string; role: UserRole }[]
    | null;
}

const COLS =
  "id,name,phone,email,cni,address,city,products,estimated_premium,stage,assigned_to,notes,lost_reason,created_at,last_activity_at";
const COLS_WITH_ASSIGNEE = `${COLS},assignee:profiles!assigned_to(name,role)`;

function firstAssignee(a: ProspectRow["assignee"]) {
  return Array.isArray(a) ? (a[0] ?? null) : a;
}

function mapProspect(row: ProspectRow): ProspectListItem {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    cni: row.cni ?? "",
    address: row.address ?? "",
    city: (row.city ?? "") as City,
    products: row.products ?? [],
    estimatedPremium: Number(row.estimated_premium),
    stage: row.stage,
    assignedTo: row.assigned_to,
    notes: row.notes ?? "",
    lostReason: row.lost_reason ?? undefined,
    createdAt: row.created_at,
    lastActivityAt: row.last_activity_at,
    assigneeName: firstAssignee(row.assignee)?.name ?? "—",
    assigneeRole: firstAssignee(row.assignee)?.role ?? null,
  };
}

/** All prospects visible to the current user (scoped by RLS). */
export async function fetchProspects(): Promise<ProspectListItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select(COLS_WITH_ASSIGNEE)
    .order("last_activity_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapProspect(r as unknown as ProspectRow));
}

/** A single prospect, or null when not found / not visible. */
export async function fetchProspect(
  id: string,
): Promise<ProspectListItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prospects")
    .select(COLS_WITH_ASSIGNEE)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProspect(data as unknown as ProspectRow) : null;
}

export interface ProspectInput {
  name: string;
  phone: string;
  email: string;
  cni: string;
  address: string;
  city: string;
  products: ProductType[];
  estimatedPremium: number;
  assignedTo: string;
  notes: string;
}

function toRow(input: ProspectInput, id?: string) {
  return {
    ...(id ? { id } : {}),
    name: input.name,
    phone: input.phone || null,
    email: input.email || null,
    cni: input.cni || null,
    address: input.address || null,
    city: input.city || null,
    products: input.products,
    estimated_premium: input.estimatedPremium,
    assigned_to: input.assignedTo,
    notes: input.notes || null,
  };
}

/**
 * Create a prospect; returns its id. An explicit `id` can be supplied so that
 * offline-queued creates keep a stable id between the local copy and the server
 * row once replayed.
 */
export async function createProspect(
  input: ProspectInput,
  id?: string,
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("prospects")
    .insert(toRow(input, id))
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateProspect(
  id: string,
  input: ProspectInput,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("prospects")
    .update(toRow(input))
    .eq("id", id);
  if (error) throw error;
}

/** Persist a stage change (and lost reason when moving to "lost"). */
export async function updateProspectStage(
  id: string,
  stage: Stage,
  lostReason?: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("prospects")
    .update({
      stage,
      lost_reason: stage === "lost" ? (lostReason ?? null) : null,
      last_activity_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
