import { createClient } from "@/lib/supabase/client";
import type { ProductType } from "@/lib/types";
import type {
  CommissionAgreement,
  CommissionBase,
  RemunerationPlanEntry,
} from "@/lib/payroll/rates";

/* --- Row shapes ------------------------------------------------------ */

interface AgreementRow {
  id: string;
  insurer_id: string;
  product_id: string | null;
  product_type: ProductType | null;
  retrocession_rate: number | null;
  rate: number;
  base: CommissionBase;
  accessory_share: number;
  effective_from: string;
  note: string | null;
}

interface PlanRow {
  id: string;
  base_fixe: number;
  performance_rate: number;
  retrocession_rate: number;
  duration_months: number;
  effective_from: string;
  note: string | null;
}

const AGREEMENT_COLS =
  "id,insurer_id,product_id,product_type,rate,retrocession_rate,base,accessory_share,effective_from,note";
const PLAN_COLS =
  "id,base_fixe,performance_rate,retrocession_rate,duration_months,effective_from,note";

/* --- Reads ----------------------------------------------------------- */

/** Agreements the current user may read (RLS scopes them by role). */
export async function fetchCommissionAgreements(): Promise<CommissionAgreement[]> {
  const { data, error } = await createClient()
    .from("commission_agreements")
    .select(AGREEMENT_COLS)
    .order("effective_from", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as AgreementRow[]).map((r) => ({
    id: r.id,
    insurerId: r.insurer_id,
    productId: r.product_id,
    productType: r.product_type,
    retrocessionRate: r.retrocession_rate === null ? null : Number(r.retrocession_rate),
    rate: Number(r.rate),
    base: r.base,
    accessoryShare: Number(r.accessory_share),
    effectiveFrom: r.effective_from,
    note: r.note ?? undefined,
  }));
}

export async function fetchRemunerationPlans(): Promise<RemunerationPlanEntry[]> {
  const { data, error } = await createClient()
    .from("remuneration_plans")
    .select(PLAN_COLS)
    .order("effective_from", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as PlanRow[]).map((r) => ({
    id: r.id,
    baseFixe: Number(r.base_fixe),
    tauxPerformance: Number(r.performance_rate),
    tauxRetrocession: Number(r.retrocession_rate),
    dureeMois: r.duration_months,
    effectiveFrom: r.effective_from,
    note: r.note ?? undefined,
  }));
}

/* --- Writes (admin only — enforced by RLS) --------------------------- */

export interface NewCommissionAgreement {
  insurerId: string;
  productId: string | null;
  productType: ProductType | null;
  /** Share passed to the commercial; null = plan default. */
  retrocessionRate: number | null;
  rate: number;
  base: CommissionBase;
  /** Share of a policy's accessories kept by the cabinet, 0..1. */
  accessoryShare: number;
  effectiveFrom: string;
  note?: string;
  createdBy: string;
}

export async function createCommissionAgreement(
  input: NewCommissionAgreement,
): Promise<void> {
  const { error } = await createClient().from("commission_agreements").insert({
    insurer_id: input.insurerId,
    product_id: input.productId,
    product_type: input.productType,
    retrocession_rate: input.retrocessionRate,
    rate: input.rate,
    base: input.base,
    accessory_share: input.accessoryShare,
    effective_from: input.effectiveFrom,
    note: input.note ?? null,
    created_by: input.createdBy,
  });
  if (error) throw error;
}

export interface NewRemunerationPlan {
  baseFixe: number;
  tauxPerformance: number;
  tauxRetrocession: number;
  dureeMois: number;
  effectiveFrom: string;
  note?: string;
  createdBy: string;
}

export async function createRemunerationPlan(
  input: NewRemunerationPlan,
): Promise<void> {
  const { error } = await createClient().from("remuneration_plans").insert({
    base_fixe: input.baseFixe,
    performance_rate: input.tauxPerformance,
    retrocession_rate: input.tauxRetrocession,
    duration_months: input.dureeMois,
    effective_from: input.effectiveFrom,
    note: input.note ?? null,
    created_by: input.createdBy,
  });
  if (error) throw error;
}
