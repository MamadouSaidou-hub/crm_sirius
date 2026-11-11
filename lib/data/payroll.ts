import { createClient } from "@/lib/supabase/client";
import type { ProductType, User } from "@/lib/types";
import { fetchAssignableCommercials } from "@/lib/data/profiles";
import {
  fetchCommissionAgreements,
  fetchRemunerationPlans,
} from "@/lib/data/commissions";
import {
  calculerRemuneration,
  type ContratInput,
  type ProduitInput,
  type RemunerationResult,
  type VersementInput,
} from "@/lib/payroll/engine";
import {
  makeRatesResolver,
  type CommissionAgreement,
  type RemunerationPlan,
  type RemunerationPlanEntry,
} from "@/lib/payroll/rates";
import {
  computeCommercialProfitability,
  computeProfitability,
  type CommercialProfitability,
  type ProfitabilityPoint,
} from "@/lib/payroll/profitability";

/* --- Types ----------------------------------------------------------- */

export interface PayrollProduct extends ProduitInput {
  code: string;
  label: string;
  /** Product line, used to pick the cabinet commission agreement. */
  productType: ProductType;
  defaultSubscription: number;
  minPayment: number;
}

export interface PayrollContract extends ContratInput {
  clientName: string;
  durationMonths: number;
  status: "actif" | "resilie";
  prospectId: string | null;
  insurerId: string;
}

export interface PayrollLine extends RemunerationResult {
  commercial: User;
}

export interface PayrollSnapshot {
  products: PayrollProduct[];
  contracts: PayrollContract[];
  payments: VersementInput[];
  lines: PayrollLine[];
  /** Plan in force for the requested period. */
  plan: RemunerationPlan;
  /** Cabinet commission rate (0..1) by contract id, for the requested period. */
  cabinetRates: Record<string, number>;
}

export interface NewPayrollContract {
  commercialId: string;
  productId: string;
  insurerId: string;
  clientName: string;
  signatureDate: string;
  subscriptionAmount: number;
  referencePremium: number;
  durationMonths: number;
  prospectId?: string | null;
}

/* --- Row shapes ------------------------------------------------------ */

interface ProductRow {
  id: string;
  code: string;
  label: string;
  product_type: ProductType;
  default_subscription: number;
  min_payment: number;
  assiette_type: ProduitInput["assietteType"];
  frequency: ProduitInput["frequenceCotisation"];
}

interface ContractRow {
  id: string;
  commercial_id: string;
  product_id: string;
  insurer_id: string;
  prospect_id: string | null;
  client_name: string;
  signature_date: string;
  subscription_amount: number;
  reference_premium: number;
  duration_months: number;
  status: "actif" | "resilie";
}

interface PaymentRow {
  id: string;
  contract_id: string;
  period: string;
  amount: number;
  is_subscription: boolean;
}

/* --- Reads ----------------------------------------------------------- */

export async function fetchPayrollProducts(): Promise<PayrollProduct[]> {
  const { data, error } = await createClient()
    .from("payroll_products")
    .select(
      "id,code,label,product_type,default_subscription,min_payment,assiette_type,frequency",
    )
    .order("label");
  if (error) throw error;
  return ((data ?? []) as ProductRow[]).map((r) => ({
    id: r.id,
    code: r.code,
    label: r.label,
    productType: r.product_type,
    defaultSubscription: Number(r.default_subscription),
    minPayment: Number(r.min_payment),
    assietteType: r.assiette_type,
    frequenceCotisation: r.frequency,
  }));
}

export async function fetchPayrollContracts(): Promise<PayrollContract[]> {
  const { data, error } = await createClient()
    .from("payroll_contracts")
    .select(
      "id,commercial_id,product_id,insurer_id,prospect_id,client_name,signature_date,subscription_amount,reference_premium,duration_months,status",
    )
    .order("signature_date", { ascending: false });
  if (error) throw error;
  return ((data ?? []) as ContractRow[]).map((r) => ({
    id: r.id,
    commercialId: r.commercial_id,
    produitId: r.product_id,
    insurerId: r.insurer_id,
    prospectId: r.prospect_id,
    clientName: r.client_name,
    dateSignature: r.signature_date,
    souscriptionMontant: Number(r.subscription_amount),
    cotisationReference: Number(r.reference_premium),
    durationMonths: r.duration_months,
    status: r.status,
  }));
}

export async function fetchPayrollPayments(): Promise<VersementInput[]> {
  const { data, error } = await createClient()
    .from("payroll_payments")
    .select("id,contract_id,period,amount,is_subscription");
  if (error) throw error;
  return ((data ?? []) as PaymentRow[]).map((r) => ({
    id: r.id,
    contratId: r.contract_id,
    periode: r.period,
    montant: Number(r.amount),
    estSouscription: r.is_subscription,
  }));
}

export interface PayrollRaw {
  products: PayrollProduct[];
  contracts: PayrollContract[];
  payments: VersementInput[];
  commercials: User[];
  agreements: CommissionAgreement[];
  plans: RemunerationPlanEntry[];
}

/** Loads every row the current user may see (RLS scopes them) — once. */
export async function fetchPayrollRaw(current: User): Promise<PayrollRaw> {
  const [products, contracts, payments, commercials, agreements, plans] =
    await Promise.all([
      fetchPayrollProducts(),
      fetchPayrollContracts(),
      fetchPayrollPayments(),
      fetchAssignableCommercials(current),
      fetchCommissionAgreements(),
      fetchRemunerationPlans(),
    ]);
  return { products, contracts, payments, commercials, agreements, plans };
}

/** Builds the per-period plan / cabinet-rate resolver from the loaded rows. */
export function ratesResolverFor(raw: PayrollRaw) {
  const productById = new Map(raw.products.map((p) => [p.id, p]));
  const contractById = new Map(raw.contracts.map((c) => [c.id, c]));

  return makeRatesResolver(raw.agreements, raw.plans, (contratId) => {
    const contract = contractById.get(contratId);
    const product = contract && productById.get(contract.produitId);
    if (!contract || !product) {
      throw new Error(`Contrat ou produit introuvable (${contratId}).`);
    }
    return { insurerId: contract.insurerId, productType: product.productType };
  });
}

/** Runs the pure engine once per visible commercial for `period`. */
export function computePayrollLines(
  raw: PayrollRaw,
  period: string,
): PayrollLine[] {
  const { plan, tauxCabinet } = ratesResolverFor(raw)(period);
  return raw.commercials.map((commercial) => ({
    ...calculerRemuneration({
      commercialId: commercial.id,
      periode: period,
      contrats: raw.contracts.filter((c) => c.commercialId === commercial.id),
      versements: raw.payments,
      produits: raw.products,
      plan,
      tauxCabinet,
    }),
    commercial,
  }));
}

export async function fetchPayrollSnapshot(
  current: User,
  period: string,
): Promise<PayrollSnapshot> {
  const raw = await fetchPayrollRaw(current);
  const { plan, tauxCabinet } = ratesResolverFor(raw)(period);
  return {
    products: raw.products,
    contracts: raw.contracts,
    payments: raw.payments,
    lines: computePayrollLines(raw, period),
    plan,
    cabinetRates: Object.fromEntries(
      raw.contracts.map((c) => [c.id, tauxCabinet(c.id)]),
    ),
  };
}

export interface ProfitabilitySnapshot {
  /** One point per period, oldest first. */
  history: ProfitabilityPoint[];
  /** Per-commercial view for the most recent period. */
  commercials: Array<CommercialProfitability & { commercial: User }>;
}

/** Cabinet profitability over `periods` (oldest first) for the visible team. */
export async function fetchProfitability(
  current: User,
  periods: string[],
): Promise<ProfitabilitySnapshot> {
  const raw = await fetchPayrollRaw(current);
  const input = {
    commercialIds: raw.commercials.map((c) => c.id),
    contrats: raw.contracts,
    versements: raw.payments,
    produits: raw.products,
    ratesFor: ratesResolverFor(raw),
  };
  const latest = periods[periods.length - 1];
  const byId = new Map(raw.commercials.map((c) => [c.id, c]));

  return {
    history: computeProfitability(input, periods),
    commercials: computeCommercialProfitability(input, latest).flatMap((row) => {
      const commercial = byId.get(row.commercialId);
      return commercial ? [{ ...row, commercial }] : [];
    }),
  };
}

/* --- Writes ---------------------------------------------------------- */

/** Creates a contract and its month-1 payments atomically (SQL function). */
export async function createPayrollContract(
  input: NewPayrollContract,
): Promise<string> {
  const { data, error } = await createClient().rpc("create_payroll_contract", {
    p_commercial: input.commercialId,
    p_product: input.productId,
    p_client: input.clientName,
    p_date: input.signatureDate,
    p_subscription: input.subscriptionAmount,
    p_premium: input.referencePremium,
    p_duration: input.durationMonths,
    p_prospect: input.prospectId ?? null,
    p_insurer: input.insurerId,
  });
  if (error) throw error;
  return data as string;
}

export async function createPayrollPayment(
  contractId: string,
  period: string,
  amount: number,
  createdBy: string,
): Promise<void> {
  const { error } = await createClient().from("payroll_payments").insert({
    contract_id: contractId,
    period,
    amount,
    is_subscription: false,
    created_by: createdBy,
  });
  if (error) throw error;
}
