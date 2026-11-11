/**
 * Cabinet profitability: what the cabinet spends paying its commercials versus
 * the brokerage commission those commercials' contracts bring in.
 *
 * Pure and DB-free, built on top of the remuneration engine.
 *
 * - Cabinet income = TAUX_CABINET x ALL payments received in the period, for
 *   every contract (the insurer pays the cabinet on each payment, whatever the
 *   contract age).
 * - Cabinet expense = sum of the commercials' total remuneration for the
 *   period (base fixe + performance bonus + acquisition commission).
 */

import { TAUX_CABINET } from "@/lib/payroll/config";
import {
  calculerRemuneration,
  type ContratInput,
  type ProduitInput,
  type VersementInput,
} from "@/lib/payroll/engine";

export interface ProfitabilityInput {
  commercialIds: string[];
  contrats: ContratInput[];
  versements: VersementInput[];
  produits: ProduitInput[];
}

export interface ProfitabilityPoint {
  periode: string;
  /** All payments received in the period, any contract age. */
  encaisse: number;
  /** Cabinet commission on contracts still paying the commercial (months 1-3). */
  commissionPerimetre: number;
  /** Cabinet commission on contracts out of scope (month 4+): pure margin. */
  commissionHorsPerimetre: number;
  /** TAUX_CABINET x encaisse. */
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

/** Sum of payments received in `periode` on the given contracts. */
function encaisseDuMois(
  periode: string,
  contratIds: Set<string>,
  versements: VersementInput[],
): number {
  return versements
    .filter((v) => v.periode === periode && contratIds.has(v.contratId))
    .reduce((sum, v) => sum + v.montant, 0);
}

export function computeProfitability(
  input: ProfitabilityInput,
  periodes: string[],
): ProfitabilityPoint[] {
  const { commercialIds, contrats, versements, produits } = input;
  const ids = new Set(commercialIds);
  const contratIds = new Set(
    contrats.filter((c) => ids.has(c.commercialId)).map((c) => c.id),
  );

  return periodes.map((periode) => {
    const lignes = commercialIds.map((commercialId) =>
      calculerRemuneration({
        commercialId,
        periode,
        contrats: contrats.filter((c) => c.commercialId === commercialId),
        versements,
        produits,
      }),
    );

    const encaisse = encaisseDuMois(periode, contratIds, versements);
    const productionPerimetre = lignes.reduce((s, l) => s + l.production, 0);
    const depensesPaie = lignes.reduce((s, l) => s + l.total, 0);
    const commissionCabinet = encaisse * TAUX_CABINET;

    return {
      periode,
      encaisse,
      commissionPerimetre: productionPerimetre * TAUX_CABINET,
      commissionHorsPerimetre: (encaisse - productionPerimetre) * TAUX_CABINET,
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

  return commercialIds.map((commercialId) => {
    const siens = contrats.filter((c) => c.commercialId === commercialId);
    const cout = calculerRemuneration({
      commercialId,
      periode,
      contrats: siens,
      versements,
      produits,
    }).total;
    const encaisse = encaisseDuMois(
      periode,
      new Set(siens.map((c) => c.id)),
      versements,
    );
    const commissionCabinet = encaisse * TAUX_CABINET;
    return {
      commercialId,
      encaisse,
      commissionCabinet,
      cout,
      net: commissionCabinet - cout,
    };
  });
}
