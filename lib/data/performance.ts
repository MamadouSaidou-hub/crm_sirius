import { createClient } from "@/lib/supabase/client";
import type {
  Objective,
  ProductType,
  Realization,
  RealizationStatus,
} from "@/lib/types";
import { insurers } from "@/lib/mock-data";

/* --- Period helpers (pure) ------------------------------------------ */

const now = new Date();
function periodOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
export const CURRENT_PERIOD = periodOf(now);
function periodMinus(n: number): string {
  return periodOf(new Date(now.getFullYear(), now.getMonth() - n, 1));
}
export function recentPeriods(count = 6): string[] {
  return Array.from({ length: count }, (_, i) => periodMinus(i));
}
export function attainment(realized: number, target: number): number {
  if (target <= 0) return 0;
  return Math.round((realized / target) * 100);
}

/* --- Objectives ----------------------------------------------------- */

interface ObjectiveRow {
  id: string;
  user_id: string;
  period: string;
  target_amount: number;
  set_by: string | null;
  created_at: string;
}
const OBJ_COLS = "id,user_id,period,target_amount,set_by,created_at";

function mapObjective(r: ObjectiveRow): Objective {
  return {
    id: r.id,
    userId: r.user_id,
    period: r.period,
    targetAmount: Number(r.target_amount),
    setBy: r.set_by ?? "",
    createdAt: r.created_at,
  };
}

export async function fetchObjectives(period: string): Promise<Objective[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("objectives")
    .select(OBJ_COLS)
    .eq("period", period);
  if (error) throw error;
  return (data ?? []).map((r) => mapObjective(r as ObjectiveRow));
}

export async function fetchObjective(
  userId: string,
  period: string,
): Promise<Objective | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("objectives")
    .select(OBJ_COLS)
    .eq("user_id", userId)
    .eq("period", period)
    .maybeSingle();
  if (error) throw error;
  return data ? mapObjective(data as ObjectiveRow) : null;
}

export async function upsertObjective(
  userId: string,
  targetAmount: number,
  setBy: string,
  period: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("objectives").upsert(
    { user_id: userId, period, target_amount: targetAmount, set_by: setBy },
    { onConflict: "user_id,period" },
  );
  if (error) throw error;
}

/* --- Realizations --------------------------------------------------- */

export interface RealizationItem extends Realization {
  commercialName: string | null;
}

interface RealizationRow {
  id: string;
  commercial_id: string;
  period: string;
  amount: number;
  product: ProductType;
  source: string;
  reference: string | null;
  status: RealizationStatus;
  declared_by: string;
  validated_by: string | null;
  validated_at: string | null;
  created_at: string;
  commercial: { name: string } | { name: string }[] | null;
}

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const REAL_COLS =
  "id,commercial_id,period,amount,product,source,reference,status,declared_by,validated_by,validated_at,created_at,commercial:profiles!commercial_id(name)";

function mapRealization(r: RealizationRow): RealizationItem {
  return {
    id: r.id,
    commercialId: r.commercial_id,
    period: r.period,
    amount: Number(r.amount),
    product: r.product,
    source: r.source,
    reference: r.reference ?? undefined,
    status: r.status,
    declaredBy: r.declared_by,
    validatedBy: r.validated_by ?? undefined,
    validatedAt: r.validated_at ?? undefined,
    createdAt: r.created_at,
    commercialName: firstOf(r.commercial)?.name ?? null,
  };
}

export async function fetchRealizations(
  period: string,
): Promise<RealizationItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("realizations")
    .select(REAL_COLS)
    .eq("period", period)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRealization(r as unknown as RealizationRow));
}

export interface DeclareInput {
  commercialId: string;
  amount: number;
  product: ProductType;
  source: string;
  reference?: string;
  period: string;
}

export async function declareRealization(input: DeclareInput): Promise<void> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("realizations").insert({
    commercial_id: input.commercialId,
    period: input.period,
    amount: input.amount,
    product: input.product,
    source: input.source,
    reference: input.reference ?? null,
    status: "pending",
    declared_by: user?.id ?? input.commercialId,
  });
  if (error) throw error;
}

export async function setRealizationStatus(
  id: string,
  status: RealizationStatus,
  validatedBy: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("realizations")
    .update({
      status,
      validated_by: validatedBy,
      validated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/* --- Pure compute helpers (operate on fetched arrays) --------------- */

export function objectiveAmount(
  objectives: Objective[],
  userId: string,
): number {
  return objectives.find((o) => o.userId === userId)?.targetAmount ?? 0;
}

export function realizedSum(
  realizations: Realization[],
  commercialId: string,
  statuses: RealizationStatus[],
): number {
  return realizations
    .filter((r) => r.commercialId === commercialId && statuses.includes(r.status))
    .reduce((s, r) => s + r.amount, 0);
}

/** Broker (apporteur) commission rate for a declared source, e.g. "nsia". */
function sourceRate(source: string): number {
  const insurer = insurers.find(
    (i) => i.shortName.toLowerCase() === source.toLowerCase(),
  );
  return insurer?.commissionRate ?? 0.1;
}

export function commissionSum(
  realizations: Realization[],
  commercialId: string,
): number {
  return realizations
    .filter((r) => r.commercialId === commercialId && r.status === "validated")
    .reduce((s, r) => s + r.amount * sourceRate(r.source), 0);
}

export function pendingItems(
  realizations: RealizationItem[],
  commercialIds: string[],
): RealizationItem[] {
  const set = new Set(commercialIds);
  return realizations
    .filter((r) => r.status === "pending" && set.has(r.commercialId))
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
