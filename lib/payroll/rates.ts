/**
 * Rate resolution: which commission rate / remuneration plan applies at a
 * given date. Pure and DB-free.
 *
 * Both tables are effective-dated and append-only. An entry stays valid until
 * a newer one (same scope) takes over, so changing a rate never alters the
 * months already computed with the previous one.
 */

import type { ProductType } from "@/lib/types";

export type CommissionBase = "ttc" | "ht" | "prime_nette";

/** Rate the cabinet gets from an insurer. `productType` null = all products. */
export interface CommissionAgreement {
  id: string;
  insurerId: string;
  productType: ProductType | null;
  /** 0..1 */
  rate: number;
  base: CommissionBase;
  /** 'YYYY-MM-DD' — valid from this date until a newer agreement of the same scope. */
  effectiveFrom: string;
  note?: string;
}

/** How commercials are paid. */
export interface RemunerationPlan {
  /** Fixed monthly amount (FCFA). */
  baseFixe: number;
  /** Bonus rate on the month's eligible production, 0..1. */
  tauxPerformance: number;
  /** Share of the cabinet commission passed on to the commercial, 0..1. */
  tauxRetrocession: number;
  /** A contract remunerates its commercial for its first N months. */
  dureeMois: number;
}

export interface RemunerationPlanEntry extends RemunerationPlan {
  id: string;
  effectiveFrom: string;
  note?: string;
}

export interface ContractScope {
  insurerId: string;
  productType: ProductType;
}

export class MissingAgreementError extends Error {
  constructor(scope: ContractScope, periode: string) {
    super(
      `Aucune convention de commission pour ${scope.insurerId} / ${scope.productType} en ${periode}.`,
    );
    this.name = "MissingAgreementError";
  }
}

export class MissingPlanError extends Error {
  constructor(periode: string) {
    super(`Aucun barème de rémunération en vigueur en ${periode}.`);
    this.name = "MissingPlanError";
  }
}

/** First day of a 'YYYY-MM' period, as 'YYYY-MM-DD'. */
export function debutPeriode(periode: string): string {
  return `${periode}-01`;
}

/**
 * The agreement applying to `scope` during `periode`: among the entries
 * already effective, a product-specific one beats an insurer-wide one, then
 * the most recent wins.
 */
export function findAgreement(
  agreements: CommissionAgreement[],
  scope: ContractScope,
  periode: string,
): CommissionAgreement | null {
  const date = debutPeriode(periode);
  const candidates = agreements.filter(
    (a) =>
      a.insurerId === scope.insurerId &&
      (a.productType === null || a.productType === scope.productType) &&
      a.effectiveFrom <= date,
  );

  candidates.sort((a, b) => {
    const specificity =
      Number(b.productType !== null) - Number(a.productType !== null);
    return specificity !== 0
      ? specificity
      : b.effectiveFrom.localeCompare(a.effectiveFrom);
  });
  return candidates[0] ?? null;
}

export function resolveCabinetRate(
  agreements: CommissionAgreement[],
  scope: ContractScope,
  periode: string,
): number {
  const agreement = findAgreement(agreements, scope, periode);
  if (!agreement) throw new MissingAgreementError(scope, periode);
  return agreement.rate;
}

export function resolvePlan(
  plans: RemunerationPlanEntry[],
  periode: string,
): RemunerationPlan {
  const date = debutPeriode(periode);
  const current = plans
    .filter((p) => p.effectiveFrom <= date)
    .sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom))[0];
  if (!current) throw new MissingPlanError(periode);
  return {
    baseFixe: current.baseFixe,
    tauxPerformance: current.tauxPerformance,
    tauxRetrocession: current.tauxRetrocession,
    dureeMois: current.dureeMois,
  };
}

/** What the engine needs to price one period. Built once per period by the caller. */
export interface PeriodRates {
  plan: RemunerationPlan;
  /** Cabinet commission rate for a contract (by id) in that period. */
  tauxCabinet: (contratId: string) => number;
}

/** Looks up each contract's insurer / product line by contract id. */
export type ContractScopeLookup = (contratId: string) => ContractScope;

/** Builds the per-period rates resolver from the raw tables. */
export function makeRatesResolver(
  agreements: CommissionAgreement[],
  plans: RemunerationPlanEntry[],
  scopeOf: ContractScopeLookup,
): (periode: string) => PeriodRates {
  return (periode) => ({
    plan: resolvePlan(plans, periode),
    tauxCabinet: (contratId) =>
      resolveCabinetRate(agreements, scopeOf(contratId), periode),
  });
}

export type EntryStatus = "current" | "future" | "past";

/**
 * Status of each effective-dated entry on `today` ('YYYY-MM-DD'), per scope
 * (`scopeOf`): the latest entry already started is "current", later ones are
 * "future", earlier ones are "past" (superseded).
 */
export function entryStatuses<T extends { id: string; effectiveFrom: string }>(
  entries: T[],
  scopeOf: (entry: T) => string,
  today: string,
): Map<string, EntryStatus> {
  const byScope = new Map<string, T[]>();
  for (const entry of entries) {
    const key = scopeOf(entry);
    byScope.set(key, [...(byScope.get(key) ?? []), entry]);
  }

  const statuses = new Map<string, EntryStatus>();
  for (const group of byScope.values()) {
    const sorted = [...group].sort((a, b) =>
      b.effectiveFrom.localeCompare(a.effectiveFrom),
    );
    const currentIndex = sorted.findIndex((e) => e.effectiveFrom <= today);
    sorted.forEach((entry, index) => {
      statuses.set(
        entry.id,
        currentIndex === -1 || index < currentIndex
          ? "future"
          : index === currentIndex
            ? "current"
            : "past",
      );
    });
  }
  return statuses;
}
