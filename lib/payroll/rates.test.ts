import { describe, expect, it } from "vitest";
import {
  MissingAgreementError,
  MissingPlanError,
  entryStatuses,
  findAgreement,
  makeRatesResolver,
  resolveCabinetRate,
  resolvePlan,
  type CommissionAgreement,
  type ContractScope,
  type RemunerationPlanEntry,
} from "@/lib/payroll/rates";

function agreement(
  over: Partial<CommissionAgreement> &
    Pick<CommissionAgreement, "rate" | "effectiveFrom">,
): CommissionAgreement {
  return {
    id: `${over.insurerId ?? "ins-nsia"}-${over.productId ?? over.productType ?? "all"}-${over.effectiveFrom}`,
    insurerId: "ins-nsia",
    productId: null,
    productType: "vie",
    retrocessionRate: null,
    base: "ttc",
    accessoryShare: 0,
    ...over,
  };
}

const LIBRE: ContractScope = {
  insurerId: "ins-nsia",
  productId: "p-libre",
  productType: "vie",
};

describe("resolveCabinetRate — dates", () => {
  const agreements = [
    agreement({ rate: 0.03, effectiveFrom: "2000-01-01" }),
    agreement({ rate: 0.04, effectiveFrom: "2026-03-01" }),
  ];

  it("keeps the old rate for periods before a new agreement", () => {
    expect(resolveCabinetRate(agreements, LIBRE, "2026-02")).toBe(0.03);
  });

  it("switches to the new rate from the month it takes effect", () => {
    expect(resolveCabinetRate(agreements, LIBRE, "2026-03")).toBe(0.04);
    expect(resolveCabinetRate(agreements, LIBRE, "2026-12")).toBe(0.04);
  });

  it("is not fooled by the order of the rows", () => {
    expect(resolveCabinetRate([...agreements].reverse(), LIBRE, "2026-03")).toBe(0.04);
  });

  it("does not apply an agreement that starts after the period", () => {
    expect(findAgreement(agreements, LIBRE, "1999-12")).toBeNull();
  });

  it("fails loudly when no agreement exists", () => {
    expect(() =>
      resolveCabinetRate(agreements, { ...LIBRE, insurerId: "ins-sunu" }, "2026-01"),
    ).toThrow(MissingAgreementError);
  });
});

describe("resolveCabinetRate — scope", () => {
  const all = [
    agreement({ productType: null, rate: 0.01, effectiveFrom: "2000-01-01" }),
    agreement({ productType: "vie", rate: 0.03, effectiveFrom: "2000-01-01" }),
    agreement({ productType: null, productId: "p-libre", rate: 0.03, effectiveFrom: "2000-01-01" }),
    agreement({ productType: null, productId: "p-deces", rate: 0.1, effectiveFrom: "2000-01-01" }),
    agreement({ insurerId: "ins-axa", productType: "vie", rate: 0.05, effectiveFrom: "2000-01-01" }),
  ];

  it("a precise product beats its line, which beats the whole insurer", () => {
    expect(resolveCabinetRate(all, { ...LIBRE, productId: "p-deces" }, "2026-01")).toBe(0.1);
    expect(resolveCabinetRate(all, { ...LIBRE, productId: "p-autre" }, "2026-01")).toBe(0.03); // line
    expect(
      resolveCabinetRate(all, { insurerId: "ins-nsia", productId: "p-x", productType: "auto" }, "2026-01"),
    ).toBe(0.01); // insurer-wide
  });

  it("a precise product keeps its rate even if a newer line rate exists", () => {
    const withNewerLine = [
      ...all,
      agreement({ productType: "vie", rate: 0.2, effectiveFrom: "2026-01-01" }),
    ];
    expect(resolveCabinetRate(withNewerLine, { ...LIBRE, productId: "p-deces" }, "2026-06")).toBe(0.1);
  });

  it("separates insurers", () => {
    expect(
      resolveCabinetRate(all, { insurerId: "ins-axa", productId: "p-axa", productType: "vie" }, "2026-01"),
    ).toBe(0.05);
  });

  it("a product-level agreement does not leak to another product", () => {
    const onlyOne = [
      agreement({ productType: null, productId: "p-deces", rate: 0.1, effectiveFrom: "2000-01-01" }),
    ];
    expect(() => resolveCabinetRate(onlyOne, LIBRE, "2026-01")).toThrow(MissingAgreementError);
  });

  it("a product-level rate can change over time independently", () => {
    const history = [
      agreement({ productType: null, productId: "p-deces", rate: 0.1, effectiveFrom: "2000-01-01" }),
      agreement({ productType: null, productId: "p-deces", rate: 0.15, effectiveFrom: "2026-09-01" }),
    ];
    const scope = { ...LIBRE, productId: "p-deces" };
    expect(resolveCabinetRate(history, scope, "2026-08")).toBe(0.1);
    expect(resolveCabinetRate(history, scope, "2026-09")).toBe(0.15);
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
  const plans: RemunerationPlanEntry[] = [
    { id: "p", baseFixe: 15_000, tauxPerformance: 0.06, tauxRetrocession: 0.1, dureeMois: 3, effectiveFrom: "2000-01-01" },
  ];
  const agreements = [
    agreement({ productType: null, productId: "p-libre", rate: 0.03, effectiveFrom: "2000-01-01" }),
    agreement({
      productType: null,
      productId: "p-deces",
      rate: 0.1,
      retrocessionRate: 0.2,
      effectiveFrom: "2000-01-01",
    }),
  ];
  const resolver = makeRatesResolver(agreements, plans, (contratId) => ({
    insurerId: "ins-nsia",
    productId: contratId === "c-deces" ? "p-deces" : "p-libre",
    productType: "vie",
  }));

  it("builds per-period rates keyed by contract", () => {
    const rates = resolver("2026-01");
    expect(rates.plan.dureeMois).toBe(3);
    expect(rates.tauxCabinet("c-libre")).toBe(0.03);
    expect(rates.tauxCabinet("c-deces")).toBe(0.1);
  });

  it("uses the product's own retrocession, else the plan's", () => {
    const rates = resolver("2026-01");
    expect(rates.tauxRetrocession("c-deces")).toBe(0.2);
    expect(rates.tauxRetrocession("c-libre")).toBe(0.1);
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
    (a) => `${a.insurerId}/${a.productId ?? a.productType ?? "*"}`,
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

describe("makeRatesResolver — plan frozen at signature", () => {
  const plans: RemunerationPlanEntry[] = [
    { id: "p1", baseFixe: 15_000, tauxPerformance: 0.06, tauxRetrocession: 0.1, dureeMois: 3, effectiveFrom: "2000-01-01" },
    { id: "p2", baseFixe: 15_000, tauxPerformance: 0, tauxRetrocession: 0.2, dureeMois: 3, effectiveFrom: "2025-12-01" },
  ];
  const agreements = [
    agreement({ productType: null, productId: "p-libre", rate: 0.03, effectiveFrom: "2000-01-01" }),
  ];
  const resolver = makeRatesResolver(
    agreements,
    plans,
    () => ({ insurerId: "ins-nsia", productId: "p-libre", productType: "vie" }),
    (contratId) => (contratId === "old" ? "2025-11-20" : "2025-12-05"),
  );

  it("uses the plan of the signature month even for later periods", () => {
    const rates = resolver("2026-01");
    expect(rates.plan.tauxRetrocession).toBe(0.2); // month's plan
    expect(rates.planOf?.("old").tauxRetrocession).toBe(0.1);
    expect(rates.planOf?.("new").tauxRetrocession).toBe(0.2);
    expect(rates.tauxRetrocession("old")).toBe(0.1);
    expect(rates.tauxRetrocession("new")).toBe(0.2);
  });
});
