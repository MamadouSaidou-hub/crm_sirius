import { describe, expect, it } from "vitest";
import {
  assietteDe,
  evaluatePolicy,
  primeNetteFromTtc,
  type PolicyInput,
} from "@/lib/payroll/policies";
import {
  MissingAgreementError,
  MissingPlanError,
  type CommissionAgreement,
  type RemunerationPlanEntry,
} from "@/lib/payroll/rates";
import { calculerRemuneration } from "@/lib/payroll/engine";
import { computeProfitability } from "@/lib/payroll/profitability";
import { PLAN_INITIAL } from "@/lib/payroll/config";

const AXA = { insurerId: "ins-axa", productId: "p-axa", productType: "auto" } as const;
const NSIA = { insurerId: "ins-nsia", productId: "p-nsia", productType: "auto" } as const;
const ASKIA = { insurerId: "ins-askia", productId: "p-askia", productType: "auto" } as const;

function agreement(
  scope: { insurerId: string; productId: string },
  rate: number,
  accessoryShare: number,
  effectiveFrom = "2000-01-01",
): CommissionAgreement {
  return {
    id: `${scope.productId}-${effectiveFrom}`,
    insurerId: scope.insurerId,
    productId: scope.productId,
    productType: null,
    rate,
    retrocessionRate: null,
    base: "prime_nette",
    accessoryShare,
    effectiveFrom,
  };
}

const AGREEMENTS = [
  agreement(AXA, 0.2, 0),
  agreement(NSIA, 0.2, 0.5),
  agreement(ASKIA, 0.25, 1),
];

/** Plan from November 2026: no bonus, 20 % retrocession. */
const PLANS: RemunerationPlanEntry[] = [
  { id: "old", ...PLAN_INITIAL, effectiveFrom: "2000-01-01" },
  {
    id: "new",
    baseFixe: 15_000,
    tauxPerformance: 0,
    tauxRetrocession: 0.2,
    dureeMois: 3,
    effectiveFrom: "2026-11-01",
  },
];

function policy(over: Partial<PolicyInput> = {}): PolicyInput {
  return {
    id: "pol-1",
    commercialId: "u-1",
    produitId: "p-axa",
    dateEffet: "2026-12-05",
    primeNette: 0,
    fga: 0,
    taxes: 0,
    accessoires: 0,
    primeTtc: 0,
    ...over,
  };
}

describe("prime nette", () => {
  it("is TTC minus FGA, taxes and accessories", () => {
    expect(primeNetteFromTtc(22_973, 345, 2_779, 3_000)).toBe(16_849);
  });

  it("never goes negative", () => {
    expect(primeNetteFromTtc(1_000, 500, 400, 300)).toBe(0);
  });
});

describe("evaluatePolicy — real bordereau lines", () => {
  it("AXA: 20 % of the prime nette, accessories not commissioned", () => {
    const r = evaluatePolicy(policy({ primeNette: 56_342, accessoires: 3_500 }), AXA, AGREEMENTS, PLANS);
    expect(r.commissionCabinet).toBeCloseTo(11_268.4);
  });

  it("NSIA: 20 % of the prime nette + half of the accessories", () => {
    const r = evaluatePolicy(
      policy({ produitId: "p-nsia", primeNette: 63_584, accessoires: 3_000 }),
      NSIA,
      AGREEMENTS,
      PLANS,
    );
    expect(r.commissionCabinet).toBeCloseTo(14_216.8);
    const small = evaluatePolicy(
      policy({ produitId: "p-nsia", primeNette: 31_571, accessoires: 1_000 }),
      NSIA,
      AGREEMENTS,
      PLANS,
    );
    expect(small.commissionCabinet).toBeCloseTo(6_814.2);
  });

  it("ASKIA: 25 % of the prime nette + all the accessories", () => {
    const r = evaluatePolicy(
      policy({ produitId: "p-askia", primeNette: 16_849, accessoires: 3_000 }),
      ASKIA,
      AGREEMENTS,
      PLANS,
    );
    expect(r.commissionCabinet).toBeCloseTo(7_212.25);
  });
});

describe("evaluatePolicy — commercial's share and dates", () => {
  const askia = policy({ produitId: "p-askia", primeNette: 16_849, accessoires: 3_000 });

  it("the commercial gets the plan's retrocession of the whole cabinet commission", () => {
    const r = evaluatePolicy(askia, ASKIA, AGREEMENTS, PLANS);
    expect(r.retrocession).toBe(0.2);
    expect(r.commissionCommercial).toBeCloseTo(7_212.25 * 0.2);
  });

  it("is paid in the month of the effective date", () => {
    expect(evaluatePolicy(askia, ASKIA, AGREEMENTS, PLANS).periode).toBe("2026-12");
  });

  it("freezes the plan at the effective date (old plan before November 2026)", () => {
    const r = evaluatePolicy({ ...askia, dateEffet: "2026-10-20" }, ASKIA, AGREEMENTS, PLANS);
    expect(r.retrocession).toBe(0.1);
  });

  it("uses the rate in force at the effective date", () => {
    const renegotiated = [...AGREEMENTS, agreement(AXA, 0.22, 0, "2027-01-01")];
    const base = policy({ primeNette: 100_000 });
    expect(evaluatePolicy({ ...base, dateEffet: "2026-12-31" }, AXA, renegotiated, PLANS).commissionCabinet).toBe(20_000);
    expect(evaluatePolicy({ ...base, dateEffet: "2027-01-02" }, AXA, renegotiated, PLANS).commissionCabinet).toBe(22_000);
  });

  it("an agreement can override the retrocession", () => {
    const custom = [{ ...agreement(AXA, 0.2, 0), retrocessionRate: 0.3 }];
    const r = evaluatePolicy(policy({ primeNette: 100_000 }), AXA, custom, PLANS);
    expect(r.commissionCommercial).toBeCloseTo(20_000 * 0.3);
  });

  it("fails loudly without an agreement or a plan", () => {
    expect(() => evaluatePolicy(policy(), { ...AXA, insurerId: "ins-x" }, AGREEMENTS, PLANS)).toThrow(
      MissingAgreementError,
    );
    // A valid agreement but no plan in force at all.
    expect(() => evaluatePolicy(policy(), AXA, AGREEMENTS, [])).toThrow(MissingPlanError);
  });
});

describe("assiette follows the agreement's base", () => {
  const p = policy({ primeNette: 50_000, primeTtc: 70_000, taxes: 8_000 });
  it("prime nette, TTC or hors taxe", () => {
    expect(assietteDe(p, "prime_nette")).toBe(50_000);
    expect(assietteDe(p, "ttc")).toBe(70_000);
    expect(assietteDe(p, "ht")).toBe(62_000);
  });
});

describe("integration with payroll and profitability", () => {
  const evaluated = [
    evaluatePolicy(policy({ id: "a", primeNette: 100_000 }), AXA, AGREEMENTS, PLANS), // 20 000 -> 4 000
    evaluatePolicy(
      policy({ id: "b", commercialId: "u-2", produitId: "p-askia", primeNette: 40_000, accessoires: 3_000 }),
      ASKIA,
      AGREEMENTS,
      PLANS,
    ),
  ];

  it("adds the commercial's share once, in the policy's month, on top of the base fixe", () => {
    const base = { commercialId: "u-1", contrats: [], versements: [], produits: [], plan: PLANS[1], tauxCabinet: () => 0, polices: evaluated };
    const dec = calculerRemuneration({ ...base, periode: "2026-12" });
    expect(dec.commissionPolices).toBeCloseTo(4_000);
    expect(dec.total).toBeCloseTo(15_000 + 4_000);
    const jan = calculerRemuneration({ ...base, periode: "2027-01" });
    expect(jan.commissionPolices).toBe(0);
    expect(jan.total).toBe(15_000);
  });

  it("only counts the policies of the commercial", () => {
    const base = { contrats: [], versements: [], produits: [], plan: PLANS[1], tauxCabinet: () => 0, polices: evaluated, periode: "2026-12" };
    expect(calculerRemuneration({ ...base, commercialId: "u-2" }).commissionPolices).toBeCloseTo((40_000 * 0.25 + 3_000) * 0.2);
  });

  it("the cabinet earns the full commission, the commercials cost their share + base fixe", () => {
    const [dec] = computeProfitability(
      {
        commercialIds: ["u-1", "u-2"],
        contrats: [],
        versements: [],
        produits: [],
        polices: evaluated,
        ratesFor: () => ({ plan: PLANS[1], tauxCabinet: () => 0, tauxRetrocession: () => 0.2 }),
      },
      ["2026-12"],
    );
    const cabinet = 20_000 + (40_000 * 0.25 + 3_000);
    const share = cabinet * 0.2;
    expect(dec.commissionCabinet).toBeCloseTo(cabinet);
    expect(dec.depensesPaie).toBeCloseTo(30_000 + share);
    expect(dec.net).toBeCloseTo(cabinet - 30_000 - share);
  });
});
