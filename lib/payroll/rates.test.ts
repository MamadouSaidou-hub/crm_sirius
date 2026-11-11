import { describe, expect, it } from "vitest";
import {
  MissingAgreementError,
  entryStatuses,
  MissingPlanError,
  findAgreement,
  makeRatesResolver,
  resolveCabinetRate,
  resolvePlan,
  type CommissionAgreement,
  type RemunerationPlanEntry,
} from "@/lib/payroll/rates";

function agreement(
  over: Partial<CommissionAgreement> & Pick<CommissionAgreement, "rate" | "effectiveFrom">,
): CommissionAgreement {
  return {
    id: `${over.insurerId ?? "ins-nsia"}-${over.productType ?? "all"}-${over.effectiveFrom}`,
    insurerId: "ins-nsia",
    productType: "vie",
    base: "ttc",
    ...over,
  };
}

const NSIA_VIE = { insurerId: "ins-nsia", productType: "vie" } as const;

describe("resolveCabinetRate", () => {
  const agreements = [
    agreement({ rate: 0.03, effectiveFrom: "2000-01-01" }),
    agreement({ rate: 0.04, effectiveFrom: "2026-03-01" }),
  ];

  it("keeps the old rate for periods before a new agreement", () => {
    expect(resolveCabinetRate(agreements, NSIA_VIE, "2026-02")).toBe(0.03);
  });

  it("switches to the new rate from the month it takes effect", () => {
    expect(resolveCabinetRate(agreements, NSIA_VIE, "2026-03")).toBe(0.04);
    expect(resolveCabinetRate(agreements, NSIA_VIE, "2026-12")).toBe(0.04);
  });

  it("is not fooled by the order of the rows", () => {
    expect(
      resolveCabinetRate([...agreements].reverse(), NSIA_VIE, "2026-03"),
    ).toBe(0.04);
  });

  it("separates insurers and product lines", () => {
    const all = [
      ...agreements,
      agreement({ insurerId: "ins-axa", rate: 0.05, effectiveFrom: "2000-01-01" }),
      agreement({ productType: "auto", rate: 0.12, effectiveFrom: "2000-01-01" }),
    ];
    expect(resolveCabinetRate(all, { insurerId: "ins-axa", productType: "vie" }, "2026-01")).toBe(0.05);
    expect(resolveCabinetRate(all, { insurerId: "ins-nsia", productType: "auto" }, "2026-01")).toBe(0.12);
  });

  it("prefers a product-specific agreement over an insurer-wide one", () => {
    const all = [
      agreement({ productType: null, rate: 0.1, effectiveFrom: "2000-01-01" }),
      agreement({ productType: "vie", rate: 0.03, effectiveFrom: "2000-01-01" }),
    ];
    expect(resolveCabinetRate(all, NSIA_VIE, "2026-01")).toBe(0.03);
    expect(
      resolveCabinetRate(all, { insurerId: "ins-nsia", productType: "sante" }, "2026-01"),
    ).toBe(0.1);
  });

  it("fails loudly when no agreement exists", () => {
    expect(() =>
      resolveCabinetRate(agreements, { insurerId: "ins-sunu", productType: "vie" }, "2026-01"),
    ).toThrow(MissingAgreementError);
  });

  it("does not apply an agreement that starts after the period", () => {
    expect(findAgreement(agreements, NSIA_VIE, "1999-12")).toBeNull();
  });
});

describe("resolvePlan", () => {
  const plans: RemunerationPlanEntry[] = [
    { id: "p1", baseFixe: 15_000, tauxPerformance: 0.06, tauxRetrocession: 0.1, dureeMois: 3, effectiveFrom: "2000-01-01" },
    { id: "p2", baseFixe: 20_000, tauxPerformance: 0.05, tauxRetrocession: 0.15, dureeMois: 3, effectiveFrom: "2026-06-01" },
  ];

  it("applies the plan in force for the period", () => {
    expect(resolvePlan(plans, "2026-05").baseFixe).toBe(15_000);
    expect(resolvePlan(plans, "2026-06").baseFixe).toBe(20_000);
    expect(resolvePlan(plans, "2026-06").tauxRetrocession).toBe(0.15);
  });

  it("fails loudly when no plan is in force", () => {
    expect(() => resolvePlan(plans, "1999-01")).toThrow(MissingPlanError);
  });
});

describe("makeRatesResolver", () => {
  it("builds per-period rates keyed by contract", () => {
    const resolver = makeRatesResolver(
      [
        agreement({ rate: 0.03, effectiveFrom: "2000-01-01" }),
        agreement({ insurerId: "ins-axa", rate: 0.05, effectiveFrom: "2000-01-01" }),
      ],
      [{ id: "p", baseFixe: 15_000, tauxPerformance: 0.06, tauxRetrocession: 0.1, dureeMois: 3, effectiveFrom: "2000-01-01" }],
      (contratId) => ({
        insurerId: contratId === "c-axa" ? "ins-axa" : "ins-nsia",
        productType: "vie",
      }),
    );
    const rates = resolver("2026-01");
    expect(rates.plan.dureeMois).toBe(3);
    expect(rates.tauxCabinet("c-nsia")).toBe(0.03);
    expect(rates.tauxCabinet("c-axa")).toBe(0.05);
  });
});

describe("entryStatuses", () => {
  const entries = [
    agreement({ rate: 0.03, effectiveFrom: "2000-01-01" }),
    agreement({ rate: 0.04, effectiveFrom: "2026-03-01" }),
    agreement({ rate: 0.05, effectiveFrom: "2026-09-01" }),
    agreement({ insurerId: "ins-axa", rate: 0.07, effectiveFrom: "2000-01-01" }),
  ];
  const statuses = entryStatuses(
    entries,
    (a) => `${a.insurerId}/${a.productType ?? "*"}`,
    "2026-05-15",
  );

  it("marks the latest started entry as current, older as past, later as future", () => {
    expect(statuses.get(entries[0].id)).toBe("past");
    expect(statuses.get(entries[1].id)).toBe("current");
    expect(statuses.get(entries[2].id)).toBe("future");
  });

  it("evaluates each scope independently", () => {
    expect(statuses.get(entries[3].id)).toBe("current");
  });
});
