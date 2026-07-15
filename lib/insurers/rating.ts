import type {
  AutoFormula,
  AutoRiskData,
  AutoUsage,
  Insurer,
  QuoteGuarantee,
  QuoteOption,
} from "@/lib/types";

/**
 * Mock auto rating engine.
 *
 * Approximates the CIMA-zone motor tariff: a regulated Responsabilité Civile
 * base driven by fiscal power, usage and driver risk, plus dommages/vol
 * premiums proportional to the vehicle value for the richer formulas.
 *
 * This is intentionally deterministic so the prototype shows stable, coherent
 * numbers. When a real connector (Askia/NSIA API) is wired in, it replaces this
 * function for that insurer while the others keep using the internal grid.
 */

/** Regulated RC base premium by fiscal-power band (FCFA / year). */
function baseRcPremium(fiscalPower: number): number {
  if (fiscalPower <= 2) return 25_000;
  if (fiscalPower <= 6) return 45_000;
  if (fiscalPower <= 10) return 70_000;
  if (fiscalPower <= 14) return 95_000;
  return 130_000;
}

const USAGE_COEFFICIENT: Record<AutoUsage, number> = {
  personal: 1,
  business: 1.15,
  transport: 1.6,
  goods: 1.4,
};

/** Share of the market value charged for the dommages/vol cover. */
const DAMAGE_RATE: Record<AutoFormula, number> = {
  rc: 0,
  tiers_plus: 0.025,
  tous_risques: 0.055,
};

/** CIMA motor taxes, applied on the net premium. */
const TAX_RATE = 0.14;

export function guaranteesFor(formula: AutoFormula): QuoteGuarantee[] {
  const rc = formula === "rc";
  const tiersPlus = formula === "tiers_plus";
  const tousRisques = formula === "tous_risques";
  return [
    { label: "Responsabilité civile", included: true },
    { label: "Défense & recours", included: !rc },
    { label: "Vol", included: tiersPlus || tousRisques },
    { label: "Incendie", included: tiersPlus || tousRisques },
    { label: "Bris de glace", included: tiersPlus || tousRisques },
    { label: "Dommages tous accidents", included: tousRisques },
  ];
}

/**
 * Price a single insurer's offer for the given risk.
 * `coefficient` and `fees` model the insurer's own loading, letting offers
 * differ even though they share the regulated RC base.
 */
export function rateAuto(risk: AutoRiskData, insurer: Insurer): QuoteOption {
  const currentYear = new Date().getFullYear();

  const rc = baseRcPremium(risk.fiscalPower) * USAGE_COEFFICIENT[risk.usage];
  const damage = risk.marketValue * DAMAGE_RATE[risk.formula];

  let net = rc + damage;

  // Driver & vehicle risk adjustments.
  if (risk.licenseYears < 2) net *= 1.15;
  if (currentYear - risk.firstRegistrationYear > 15) net *= 1.1;

  // Per-insurer commercial loading (derived from the commission rate so each
  // partner produces a distinct, stable figure).
  const coefficient = 0.95 + insurer.commissionRate;
  net = Math.round((net * coefficient) / 100) * 100;

  const taxes = Math.round((net * TAX_RATE) / 100) * 100;
  const fees = insurer.integrationMode === "api" ? 5_000 : 7_500;
  const totalPremium = net + taxes + fees;

  return {
    insurerId: insurer.id,
    formula: risk.formula,
    netPremium: net,
    taxes,
    fees,
    totalPremium,
    guarantees: guaranteesFor(risk.formula),
    validityDays: 30,
    integrationMode: insurer.integrationMode,
  };
}
