import { createClient } from "@/lib/supabase/client";
import type { Stage, StageHistoryEntry } from "@/lib/types";

/** A stage-history entry enriched with the author's name. */
export interface StageHistoryItem extends StageHistoryEntry {
  changedByName: string | null;
}

interface Row {
  id: string;
  prospect_id: string;
  from_stage: Stage | null;
  to_stage: Stage;
  changed_by: string;
  changed_at: string;
  author: { name: string } | { name: string }[] | null;
}

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const COLS =
  "id,prospect_id,from_stage,to_stage,changed_by,changed_at,author:profiles!changed_by(name)";

function mapRow(r: Row): StageHistoryItem {
  return {
    id: r.id,
    prospectId: r.prospect_id,
    from: r.from_stage,
    to: r.to_stage,
    changedBy: r.changed_by,
    changedAt: r.changed_at,
    changedByName: firstOf(r.author)?.name ?? null,
  };
}

export async function fetchStageHistory(
  prospectId: string,
): Promise<StageHistoryItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("stage_history")
    .select(COLS)
    .eq("prospect_id", prospectId)
    .order("changed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Row));
}

export async function insertStageChange(
  prospectId: string,
  from: Stage | null,
  to: Stage,
  changedBy: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("stage_history").insert({
    prospect_id: prospectId,
    from_stage: from,
    to_stage: to,
    changed_by: changedBy,
  });
  if (error) throw error;
}
