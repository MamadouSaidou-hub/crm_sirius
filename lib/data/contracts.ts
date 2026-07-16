import { createClient } from "@/lib/supabase/client";
import type {
  AutoFormula,
  Contract,
  ContractStatus,
  IntegrationMode,
  PaymentMethod,
  PaymentStatus,
} from "@/lib/types";

/** A contract enriched with its insurer's name and integration mode. */
export interface ContractItem extends Contract {
  insurerName: string | null;
  integrationMode: IntegrationMode | null;
}

interface Row {
  id: string;
  quote_id: string | null;
  prospect_id: string;
  insurer_id: string;
  formula: AutoFormula;
  total_premium: number;
  effective_date: string;
  expiry_date: string;
  status: ContractStatus;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  policy_number: string | null;
  attestation_number: string | null;
  created_by: string;
  created_at: string;
  insurer:
    | { name: string; integration_mode: IntegrationMode }
    | { name: string; integration_mode: IntegrationMode }[]
    | null;
}

function firstOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

const COLS =
  "id,quote_id,prospect_id,insurer_id,formula,total_premium,effective_date,expiry_date,status,payment_method,payment_status,policy_number,attestation_number,created_by,created_at,insurer:insurers!insurer_id(name,integration_mode)";

function mapRow(r: Row): ContractItem {
  const ins = firstOf(r.insurer);
  return {
    id: r.id,
    quoteId: r.quote_id ?? "",
    prospectId: r.prospect_id,
    insurerId: r.insurer_id,
    formula: r.formula,
    totalPremium: Number(r.total_premium),
    effectiveDate: r.effective_date,
    expiryDate: r.expiry_date,
    status: r.status,
    paymentMethod: r.payment_method,
    paymentStatus: r.payment_status,
    policyNumber: r.policy_number ?? undefined,
    attestationNumber: r.attestation_number ?? undefined,
    createdBy: r.created_by,
    createdAt: r.created_at,
    insurerName: ins?.name ?? null,
    integrationMode: ins?.integration_mode ?? null,
  };
}

export async function fetchContractsForProspect(
  prospectId: string,
): Promise<ContractItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .select(COLS)
    .eq("prospect_id", prospectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => mapRow(r as unknown as Row));
}

export interface ContractInput {
  prospectId: string;
  insurerId: string;
  formula: AutoFormula;
  totalPremium: number;
  effectiveDate: string;
  expiryDate: string;
  status: ContractStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  policyNumber?: string;
  attestationNumber?: string;
  createdBy: string;
}

export async function createContract(
  input: ContractInput,
): Promise<ContractItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("contracts")
    .insert({
      prospect_id: input.prospectId,
      insurer_id: input.insurerId,
      formula: input.formula,
      total_premium: input.totalPremium,
      effective_date: input.effectiveDate,
      expiry_date: input.expiryDate,
      status: input.status,
      payment_method: input.paymentMethod,
      payment_status: input.paymentStatus,
      policy_number: input.policyNumber ?? null,
      attestation_number: input.attestationNumber ?? null,
      created_by: input.createdBy,
    })
    .select(COLS)
    .single();
  if (error) throw error;
  return mapRow(data as unknown as Row);
}
