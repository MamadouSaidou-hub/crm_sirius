/**
 * Core remuneration engine for commercials (insurance brokerage).
 *
 * Pure, DB-free and UI-free by design: every function takes plain data in and
 * returns plain data out, so it can be unit-tested without a database.
 *
 * GOLDEN RULE: a contract only remunerates its commercial for its first
 * DUREE_REMUNERATION_MOIS months of existence (signature month = month 1).
 * From month 4 onward it is entirely out of the commercial's scope: no more
 * acquisition commission, and its payments no longer count in the monthly
 * production.
 */

import {
  BASE_FIXE,
  DUREE_REMUNERATION_MOIS,
  TAUX_COMMISSION_ACQUISITION,
  TAUX_PERFORMANCE,
} from "@/lib/payroll/config";

export type AssietteType = "FIGEE" | "VARIABLE";
export type FrequenceCotisation = "mensuelle" | "annuelle";

export interface ProduitInput {
  id: string;
  assietteType: AssietteType;
  /**
   * Kept as data for future evolution; acquisition commission currently
   * treats annual and monthly contributions the same way (frozen basis).
   * TODO: branch on this field if annual premiums need a different treatment
   * (e.g. spreading the annual premium across the 3 eligible months).
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
  commissionAcquisition: number;
  production: number;
}

export interface RemunerationResult {
  commercialId: string;
  periode: string;
  baseFixe: number;
  production: number;
  primePerformance: number;
  commissionAcquisitionTotale: number;
  total: number;
  contrats: ContratDetail[];
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

/** A contract remunerates its commercial only while age is in [1, DUREE_REMUNERATION_MOIS]. */
export function estEligible(age: number): boolean {
  return age >= 1 && age <= DUREE_REMUNERATION_MOIS;
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
}

/**
 * Computes a commercial's remuneration for one accounting month.
 * Remuneration(mois) = BASE_FIXE + PrimePerformance(mois) + Sum(CommissionAcquisition(mois))
 */
export function calculerRemuneration(
  input: CalculerRemunerationInput,
): RemunerationResult {
  const { commercialId, periode, contrats, versements, produits } = input;
  const produitsById = new Map(produits.map((p) => [p.id, p]));

  const contratsDetail: ContratDetail[] = contrats.map((contrat) => {
    const age = ageContrat(periode, contrat.dateSignature);

    if (!estEligible(age)) {
      return {
        contratId: contrat.id,
        age,
        eligible: false,
        motifExclusion:
          age > DUREE_REMUNERATION_MOIS
            ? `Sorti du périmètre (>${DUREE_REMUNERATION_MOIS} mois)`
            : "Contrat pas encore signé sur cette période",
        assiette: 0,
        commissionAcquisition: 0,
        production: 0,
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

    return {
      contratId: contrat.id,
      age,
      eligible: true,
      motifExclusion: null,
      assiette,
      commissionAcquisition: assiette * TAUX_COMMISSION_ACQUISITION,
      production,
    };
  });

  const production = contratsDetail.reduce((sum, c) => sum + c.production, 0);
  const primePerformance = production * TAUX_PERFORMANCE;
  const commissionAcquisitionTotale = contratsDetail.reduce(
    (sum, c) => sum + c.commissionAcquisition,
    0,
  );

  return {
    commercialId,
    periode,
    baseFixe: BASE_FIXE,
    production,
    primePerformance,
    commissionAcquisitionTotale,
    total: BASE_FIXE + primePerformance + commissionAcquisitionTotale,
    contrats: contratsDetail,
  };
}
