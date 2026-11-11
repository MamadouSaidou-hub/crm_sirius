/**
 * Named business constants for the commercial remuneration engine.
 * Change rates/amounts here only — nowhere else.
 */

/** Fixed monthly amount guaranteed to every active commercial (FCFA). */
export const BASE_FIXE = 15_000;

/** Performance bonus rate applied to the month's eligible production. */
export const TAUX_PERFORMANCE = 0.06;

/** Brokerage commission rate the cabinet receives from the insurer (NSIA). */
export const TAUX_CABINET = 0.03;

/** Share of the cabinet's commission retroceded to the commercial. */
export const TAUX_RETROCESSION = 0.1;

/** Effective acquisition commission rate: TAUX_CABINET * TAUX_RETROCESSION. */
export const TAUX_COMMISSION_ACQUISITION = TAUX_CABINET * TAUX_RETROCESSION;

/**
 * A contract only remunerates its commercial for its first N months
 * (month 1 = subscription + first contribution, months 2 and 3 = following
 * contributions). After that, every payment goes to the cabinet, whatever the
 * contract duration (10 years, 50 years...).
 */
export const DUREE_REMUNERATION_MOIS = 3;

/** Monthly production target applied to every commercial (FCFA). */
export const OBJECTIF_MENSUEL_COMMERCIAL = 500_000;
