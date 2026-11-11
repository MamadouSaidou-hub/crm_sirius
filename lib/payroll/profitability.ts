/**
 * Cabinet profitability: what the cabinet spends paying its commercials versus
 * the brokerage commission those commercials' contracts bring in.
 *
 * Pure and DB-free, built on top of the remuneration engine.
 *
 * - Cabinet income = for every payment received in the period, the amount x
 *   the cabinet commission rate of that contract's agreement (any contract
 *   age: the insurer pays the cabinet on each payment).
 * - Cabinet expense = sum of the commercials' total remuneration for the
 *   period (base fixe + performance bonus + acquisition commission).
 */

import {
  calculerRemuneration,
  type ContratInput,
  type ProduitInput,
  type VersementInput,
} from "@/lib/payroll/engine";
import type { PeriodRates } from "@/lib/payroll/rates";

export interface ProfitabilityInput {
  commercialIds: string[];
  contrats: ContratInput[];
  versements: VersementInput[];
  produits: ProduitInput[];
  /** Resolves the plan and cabinet rates in force for a period. */
  ratesFor: (periode: string) => PeriodRates;
}

export interface ProfitabilityPoint {
  periode: string;
  /** All payments received in the period, any contract age. */
  encaisse: number;
  /** Cabinet commission on contracts still paying the commercial. */
  commissionPerimetre: number;
  /** Cabinet commission on contracts out of scope: pure margin. */
  commissionHorsPerimetre: number;
  /** commissionPerimetre + commissionHorsPerimetre. */
  commissionCabinet: number;
  baseFixe: number;
  primePerformance: number;
  commissionAcquisition: number;
  /** Total spent on commercials' remuneration. */
  depensesPaie: number;
  /** commissionCabinet - depensesPaie (positive = gain, negative = loss). */
  net: number;
}

export interface CommercialProfitability {
  commercialId: string;
  /** Payments received in the period on this commercial's contracts. */
  encaisse: number;
  commissionCabinet: number;
  cout: number;
  net: number;
}

/** Sum of a contract's payments received in `periode`. */
function encaisseContrat(
  periode: string,
  contratId: string,
  versements: VersementInput[],
): number {
  return versements
    .filter((v) => v.periode === periode && v.contratId === contratId)
    .reduce((sum, v) => sum + v.montant, 0);
}

export function computeProfitability(
  input: ProfitabilityInput,
  periodes: string[],
): ProfitabilityPoint[] {
  const { commercialIds, contrats, versements, produits } = input;
  const ids = new Set(commercialIds);
  const contratsEquipe = contrats.filter((c) => ids.has(c.commercialId));

  return periodes.map((periode) => {
    const { plan, tauxCabinet } = input.ratesFor(periode);
    const lignes = commercialIds.map((commercialId) =>
      calculerRemuneration({
        commercialId,
        periode,
        contrats: contrats.filter((c) => c.commercialId === commercialId),
        versements,
        produits,
        plan,
        tauxCabinet,
      }),
    );
    const eligibles = new Set(
      lignes.flatMap((l) =>
        l.contrats.filter((c) => c.eligible).map((c) => c.contratId),
      ),
    );

    let encaisse = 0;
    let commissionPerimetre = 0;
    let commissionHorsPerimetre = 0;
    for (const contrat of contratsEquipe) {
      const montant = encaisseContrat(periode, contrat.id, versements);
      if (montant === 0) continue;
      const commission = montant * tauxCabinet(contrat.id);
      encaisse += montant;
      if (eligibles.has(contrat.id)) commissionPerimetre += commission;
      else commissionHorsPerimetre += commission;
    }

    const depensesPaie = lignes.reduce((s, l) => s + l.total, 0);
    const commissionCabinet = commissionPerimetre + commissionHorsPerimetre;

    return {
      periode,
      encaisse,
      commissionPerimetre,
      commissionHorsPerimetre,
      commissionCabinet,
      baseFixe: lignes.reduce((s, l) => s + l.baseFixe, 0),
      primePerformance: lignes.reduce((s, l) => s + l.primePerformance, 0),
      commissionAcquisition: lignes.reduce(
        (s, l) => s + l.commissionAcquisitionTotale,
        0,
      ),
      depensesPaie,
      net: commissionCabinet - depensesPaie,
    };
  });
}

/** Per-commercial view for one period: what each one brings vs what each costs. */
export function computeCommercialProfitability(
  input: ProfitabilityInput,
  periode: string,
): CommercialProfitability[] {
  const { commercialIds, contrats, versements, produits } = input;
  const { plan, tauxCabinet } = input.ratesFor(periode);

  return commercialIds.map((commercialId) => {
    const siens = contrats.filter((c) => c.commercialId === commercialId);
    const cout = calculerRemuneration({
      commercialId,
      periode,
      contrats: siens,
      versements,
      produits,
      plan,
      tauxCabinet,
    }).total;

    let encaisse = 0;
    let commissionCabinet = 0;
    for (const contrat of siens) {
      const montant = encaisseContrat(periode, contrat.id, versements);
      encaisse += montant;
      commissionCabinet += montant * tauxCabinet(contrat.id);
    }

    return {
      commercialId,
      encaisse,
      commissionCabinet,
      cout,
      net: commissionCabinet - cout,
    };
  });
}
