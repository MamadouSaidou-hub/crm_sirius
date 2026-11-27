/**
 * Per-policy commission (IARD: auto, travel, health…).
 *
 * Unlike life products (a commission on every monthly payment, for the first
 * N months), a policy is commissioned ONCE, in the month of its effective date:
 *
 *   cabinet commission = base x rate + accessories x accessory share
 *   commercial's share = cabinet commission x retrocession
 *
 * The rate, the accessory share and the retrocession are the ones in force
 * when the policy takes effect (agreements and plans are effective-dated), so a
 * later renegotiation never changes a policy already issued.
 *
 * Pure and DB-free.
 */

import {
  MissingAgreementError,
  findAgreement,
  resolvePlan,
  type CommissionAgreement,
  type CommissionBase,
  type ContractScope,
  type RemunerationPlanEntry,
} from "@/lib/payroll/rates";

export interface PolicyInput {
  id: string;
  commercialId: string;
  produitId: string;
  /** 'YYYY-MM-DD'. Decides the payroll month and the rates applied. */
  dateEffet: string;
  primeNette: number;
  fga: number;
  taxes: number;
  accessoires: number;
  primeTtc: number;
}

/** A policy priced with the rates in force at its effective date. */
export interface PolicyEvaluated {
  policyId: string;
  commercialId: string;
  /** Payroll month ('YYYY-MM') = month of the effective date. */
  periode: string;
  base: CommissionBase;
  /** Amount the rate applies to, according to the agreement's base. */
  assiette: number;
  tauxCabinet: number;
  partAccessoires: number;
  accessoires: number;
  /** What the cabinet earns on this policy. */
  commissionCabinet: number;
  retrocession: number;
  /** What the commercial earns on this policy. */
  commissionCommercial: number;
}

/** Prime nette = TTC minus FGA, taxes and accessories (never negative). */
export function primeNetteFromTtc(
  primeTtc: number,
  fga: number,
  taxes: number,
  accessoires: number,
): number {
  return Math.max(0, primeTtc - fga - taxes - accessoires);
}

/** The amount the agreement's rate applies to. */
export function assietteDe(policy: PolicyInput, base: CommissionBase): number {
  switch (base) {
    case "prime_nette":
      return policy.primeNette;
    case "ttc":
      return policy.primeTtc;
    case "ht":
      return Math.max(0, policy.primeTtc - policy.taxes);
  }
}

/** Month ('YYYY-MM') of a 'YYYY-MM-DD' date. */
export function periodeDe(date: string): string {
  return date.slice(0, 7);
}

/**
 * Prices one policy. Throws `MissingAgreementError` / `MissingPlanError` when no
 * agreement or plan was in force at the effective date (never a silent 0).
 */
export function evaluatePolicy(
  policy: PolicyInput,
  scope: ContractScope,
  agreements: CommissionAgreement[],
  plans: RemunerationPlanEntry[],
): PolicyEvaluated {
  const periode = periodeDe(policy.dateEffet);
  const agreement = findAgreement(agreements, scope, periode);
  if (!agreement) throw new MissingAgreementError(scope, periode);
  const plan = resolvePlan(plans, periode);

  const assiette = assietteDe(policy, agreement.base);
  const commissionCabinet =
    assiette * agreement.rate + policy.accessoires * agreement.accessoryShare;
  const retrocession = agreement.retrocessionRate ?? plan.tauxRetrocession;

  return {
    policyId: policy.id,
    commercialId: policy.commercialId,
    periode,
    base: agreement.base,
    assiette,
    tauxCabinet: agreement.rate,
    partAccessoires: agreement.accessoryShare,
    accessoires: policy.accessoires,
    commissionCabinet,
    retrocession,
    commissionCommercial: commissionCabinet * retrocession,
  };
}
