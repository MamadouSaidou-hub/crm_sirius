/**
 * Core remuneration engine for commercials (insurance brokerage).
 *
 * Pure, DB-free and UI-free by design: every function takes plain data in and
 * returns plain data out, so it can be unit-tested without a database.
 * Rates are never read from constants: the caller passes the remuneration plan
 * and a per-contract cabinet-rate lookup resolved for the period (see
 * `rates.ts`), so changing a rate is a data change, not a code change.
 *
 * GOLDEN RULE: a contract only remunerates its commercial for its first
 * `plan.dureeMois` months of existence (signature month = month 1). After
 * that it is entirely out of the commercial's scope: no more acquisition
 * commission, and its payments no longer count in the monthly production.
 */

import type { RemunerationPlan } from "@/lib/payroll/rates";
import type { PolicyEvaluated } from "@/lib/payroll/policies";

export type AssietteType = "FIGEE" | "VARIABLE";
export type FrequenceCotisation = "mensuelle" | "annuelle";

export interface ProduitInput {
  id: string;
  assietteType: AssietteType;
  /**
   * Kept as data for future evolution; acquisition commission currently
   * treats annual and monthly contributions the same way (frozen basis).
   * TODO: branch on this field if annual premiums need a different treatment
   * (e.g. spreading the annual premium across the eligible months).
   */
  frequenceCotisation: FrequenceCotisation;
}

export interface ContratInput {
  id: string;
  commercialId: string;
  produitId: string;
  /** Signature date, 'YYYY-MM-DD'. Only the year/month are used. */
  dateSignature: string;
  souscriptionMontant: number;
  /** Reference monthly contribution captured at signature (frozen basis for FIGEE). */
  cotisationReference: number;
  /**
   * Contract duration in months. The cabinet is only commissioned by the
   * insurer for the contract's duration; unset = no limit.
   */
  dureeContratMois?: number;
}

export interface VersementInput {
  id: string;
  contratId: string;
  /** Accounting month this payment was received in, 'YYYY-MM'. */
  periode: string;
  montant: number;
  estSouscription: boolean;
}

export interface ContratDetail {
  contratId: string;
  age: number;
  eligible: boolean;
  motifExclusion: string | null;
  assiette: number;
  /** Effective acquisition rate: cabinet rate x retrocession (0 when not eligible). */
  tauxCommission: number;
  commissionAcquisition: number;
  production: number;
  /** Bonus on this contract's production, at the rate frozen at its signature. */
  primePerformance: number;
}

export interface RemunerationResult {
  commercialId: string;
  periode: string;
  baseFixe: number;
  /** Life payments + IARD policies (prime TTC) of the month: what the objective measures. */
  production: number;
  /** Part of `production` coming from IARD policies. */
  productionPolices: number;
  primePerformance: number;
  commissionAcquisitionTotale: number;
  /** Commercial's share of the IARD policies taking effect this month. */
  commissionPolices: number;
  total: number;
  contrats: ContratDetail[];
  /** IARD policies taking effect this month (already priced). */
  polices: PolicyEvaluated[];
}

/** Splits a 'YYYY-MM' or 'YYYY-MM-DD' string into {annee, mois} (mois 1-12). */
function parseAnneeMois(value: string): { annee: number; mois: number } {
  const [anneeStr, moisStr] = value.split("-");
  return { annee: Number(anneeStr), mois: Number(moisStr) };
}

/**
 * Age (in months) of a contract during `periode`, counting the signature
 * month as age 1. A contract signed after `periode` has an age <= 0 and is
 * never eligible (it does not exist yet).
 */
export function ageContrat(periode: string, dateSignature: string): number {
  const p = parseAnneeMois(periode);
  const s = parseAnneeMois(dateSignature);
  return p.annee * 12 + p.mois - (s.annee * 12 + s.mois) + 1;
}

/** A contract remunerates its commercial only while age is in [1, dureeMois]. */
export function estEligible(age: number, dureeMois: number): boolean {
  return age >= 1 && age <= dureeMois;
}

/**
 * Acquisition basis for one contract's payment(s) in `periode`.
 * - VARIABLE: the actually received amount(s) this period.
 * - FIGEE: the frozen reference basis (souscription + cotisation_reference on
 *   month 1, cotisation_reference alone afterwards), whatever was actually paid.
 */
function calculerAssiette(
  produit: ProduitInput,
  contrat: ContratInput,
  age: number,
  versementsDuMois: VersementInput[],
): number {
  if (produit.assietteType === "VARIABLE") {
    return versementsDuMois.reduce((sum, v) => sum + v.montant, 0);
  }
  if (age === 1) {
    return contrat.souscriptionMontant + contrat.cotisationReference;
  }
  return contrat.cotisationReference;
}

export interface CalculerRemunerationInput {
  commercialId: string;
  periode: string;
  /** Contracts belonging to this commercial (any status/age; filtering happens inside). */
  contrats: ContratInput[];
  /** Payments for those contracts, any periode (filtering happens inside). */
  versements: VersementInput[];
  /** Products referenced by `contrats`. */
  produits: ProduitInput[];
  /** Remuneration plan in force for `periode`. */
  plan: RemunerationPlan;
  /** Cabinet commission rate (0..1) applying to a contract in `periode`. */
  tauxCabinet: (contratId: string) => number;
  /**
   * Share of the cabinet commission passed to the commercial for a contract
   * (the product's agreement may override the plan). Defaults to the plan's.
   */
  tauxRetrocession?: (contratId: string) => number;
  /**
   * Plan frozen at a contract's signature date: its duration, bonus rate and
   * default retrocession follow the plan in force when it was signed. The base
   * fixe still comes from `plan` (the month's). Defaults to `plan`.
   */
  planOf?: (contratId: string) => RemunerationPlan;
  /**
   * IARD policies already priced at their effective date (see `policies.ts`).
   * Only those of this commercial taking effect in `periode` count, once.
   */
  polices?: PolicyEvaluated[];
}

/**
 * Computes a commercial's remuneration for one accounting month.
 * Remuneration(mois) = baseFixe + PrimePerformance(mois) + Sum(CommissionAcquisition(mois))
 */
export function calculerRemuneration(
  input: CalculerRemunerationInput,
): RemunerationResult {
  const { commercialId, periode, contrats, versements, produits, plan } = input;
  const produitsById = new Map(produits.map((p) => [p.id, p]));

  const contratsDetail: ContratDetail[] = contrats.map((contrat) => {
    const age = ageContrat(periode, contrat.dateSignature);
    const contractPlan = input.planOf?.(contrat.id) ?? plan;

    if (!estEligible(age, contractPlan.dureeMois)) {
      return {
        contratId: contrat.id,
        age,
        eligible: false,
        motifExclusion:
          age > contractPlan.dureeMois
            ? `Sorti du périmètre (>${contractPlan.dureeMois} mois)`
            : "Contrat pas encore signé sur cette période",
        assiette: 0,
        tauxCommission: 0,
        commissionAcquisition: 0,
        production: 0,
        primePerformance: 0,
      };
    }

    const versementsDuMois = versements.filter(
      (v) => v.contratId === contrat.id && v.periode === periode,
    );
    const production = versementsDuMois.reduce((sum, v) => sum + v.montant, 0);

    const produit = produitsById.get(contrat.produitId);
    if (!produit) {
      throw new Error(
        `Produit introuvable (id=${contrat.produitId}) pour le contrat ${contrat.id}`,
      );
    }

    const assiette = calculerAssiette(produit, contrat, age, versementsDuMois);
    const retrocession =
      input.tauxRetrocession?.(contrat.id) ?? contractPlan.tauxRetrocession;
    const tauxCommission = input.tauxCabinet(contrat.id) * retrocession;

    return {
      contratId: contrat.id,
      age,
      eligible: true,
      motifExclusion: null,
      assiette,
      tauxCommission,
      commissionAcquisition: assiette * tauxCommission,
      production,
      primePerformance: production * contractPlan.tauxPerformance,
    };
  });

  const production = contratsDetail.reduce((sum, c) => sum + c.production, 0);
  const primePerformance = contratsDetail.reduce(
    (sum, c) => sum + c.primePerformance,
    0,
  );
  const commissionAcquisitionTotale = contratsDetail.reduce(
    (sum, c) => sum + c.commissionAcquisition,
    0,
  );

  const polices = (input.polices ?? []).filter(
    (p) => p.commercialId === commercialId && p.periode === periode,
  );
  const commissionPolices = polices.reduce(
    (sum, p) => sum + p.commissionCommercial,
    0,
  );
  const productionPolices = polices.reduce((sum, p) => sum + p.production, 0);

  return {
    commercialId,
    periode,
    baseFixe: plan.baseFixe,
    // The monthly objective counts life payments AND IARD policies. The
    // performance bonus stays on life contracts only (see primePerformance).
    production: production + productionPolices,
    productionPolices,
    primePerformance,
    commissionAcquisitionTotale,
    commissionPolices,
    total:
      plan.baseFixe +
      primePerformance +
      commissionAcquisitionTotale +
      commissionPolices,
    contrats: contratsDetail,
    polices,
  };
}
