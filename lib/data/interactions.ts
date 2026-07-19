import { createClient } from "@/lib/supabase/client";
import type { Interaction, InteractionType, UserRole } from "@/lib/types";

/** An interaction enriched with its author's name and role. */
export interface InteractionItem extends Interaction {
  authorName: string;
  authorRole: UserRole | null;
}

interface Row {
  id: string;
  prospect_id: string;
  type: InteractionType;
  summary: string;
  duration_min: number | null;
  created_by: string;
  created_at: string;
  author:
    | { name: string; role: UserRole }
    | { name: string; role: UserRole }[]
    | null;
}

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const COLS =
  "id,prospect_id,type,summary,duration_min,created_by,created_at,author:profiles!created_by(name,role)";

function mapRow(r: Row): InteractionItem {
  const a = firstOf(r.author);
  return {
    id: r.id,
    prospectId: r.prospect_id,
    type: r.type,
    summary: r.summary,
    durationMin: r.duration_min ?? undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
    authorName: a?.name ?? "—",
    authorRole: a?.role ?? null,
  };
}

export async function fetchInteractions(
  prospectId: string,
): Promise<InteractionItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interactions")
    .select(COLS)
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Row));
}

/** A recent interaction enriched with its prospect name (dashboard feed). */
export interface RecentActivity extends InteractionItem {
  prospectName: string | null;
}

interface RecentRow extends Row {
  prospect: { name: string } | { name: string }[] | null;
}

const RECENT_COLS = `${COLS},prospect:prospects!prospect_id(name)`;

export async function fetchRecentInteractions(
  limit = 10,
): Promise<RecentActivity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interactions")
    .select(RECENT_COLS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((r) => {
    const row = r as unknown as RecentRow;
    return { ...mapRow(row), prospectName: firstOf(row.prospect)?.name ?? null };
  });
}

export interface InteractionInput {
  prospectId: string;
  type: InteractionType;
  summary: string;
  durationMin?: number;
  createdBy: string;
}

export async function createInteraction(
  input: InteractionInput,
  id?: string,
): Promise<InteractionItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("interactions")
    .insert({
      ...(id ? { id } : {}),
      prospect_id: input.prospectId,
      type: input.type,
      summary: input.summary,
      duration_min: input.durationMin ?? null,
      created_by: input.createdBy,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return mapRow(data as unknown as Row);
}
