/**
 * Static business constants for payroll.
 *
 * Commission rates and the remuneration plan are NOT hard-coded here any more:
 * they are effective-dated data (tables `commission_agreements` and
 * `remuneration_plans`, edited by an admin). The values below only mirror the
 * initial seed and serve as test fixtures.
 */

import type { RemunerationPlan } from "@/lib/payroll/rates";

/** Monthly production target applied to every commercial (FCFA). */
export const OBJECTIF_MENSUEL_COMMERCIAL = 500_000;

/**
 * Initial plan (seed of `remuneration_plans`): 15 000 F fixed, 6 % bonus on
 * production, 10 % of the cabinet commission passed on to the commercial, for
 * a contract's first 3 months (month 1 = signature with subscription + first
 * contribution). After that, every payment goes to the cabinet, whatever the
 * contract duration.
 */
export const PLAN_INITIAL: RemunerationPlan = {
  baseFixe: 15_000,
  tauxPerformance: 0.06,
  tauxRetrocession: 0.1,
  dureeMois: 3,
};

/**
 * Initial NSIA life agreement (seed of `commission_agreements`): 3 % on every
 * payment received, on the amount INCLUDING taxes — exactly the amount entered
 * in the app.
 */
export const TAUX_CABINET_NSIA_VIE = 0.03;
