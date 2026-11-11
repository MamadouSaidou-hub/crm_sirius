import { describe, expect, it } from "vitest";
import {
  computeCommercialProfitability,
  computeProfitability,
  type ProfitabilityInput,
} from "@/lib/payroll/profitability";

const INPUT: ProfitabilityInput = {
  commercialIds: ["u-1", "u-2"],
  produits: [
    { id: "p", assietteType: "VARIABLE", frequenceCotisation: "mensuelle" },
  ],
  contrats: [
    {
      id: "c-1",
      commercialId: "u-1",
      produitId: "p",
      dateSignature: "2025-01-10",
      souscriptionMontant: 100_000,
      cotisationReference: 50_000,
    },
  ],
  versements: [
    { id: "v1", contratId: "c-1", periode: "2025-01", montant: 100_000, estSouscription: true },
    { id: "v2", contratId: "c-1", periode: "2025-01", montant: 50_000, estSouscription: false },
    { id: "v3", contratId: "c-1", periode: "2025-04", montant: 50_000, estSouscription: false },
  ],
};

describe("computeProfitability", () => {
  const [mois1, , , mois4] = computeProfitability(INPUT, [
    "2025-01",
    "2025-02",
    "2025-03",
    "2025-04",
  ]);

  it("month 1: cabinet earns 3% of 150 000 and pays 24 450 + one base fixe", () => {
    expect(mois1.encaisse).toBe(150_000);
    expect(mois1.commissionCabinet).toBeCloseTo(4_500);
    // u-1: 24 450 ; u-2 has no contract: base fixe only (15 000).
    expect(mois1.depensesPaie).toBeCloseTo(24_450 + 15_000);
    expect(mois1.net).toBeCloseTo(4_500 - 39_450);
    expect(mois1.commissionHorsPerimetre).toBeCloseTo(0);
  });

  it("splits the cost into base fixe, bonus and acquisition commission", () => {
    expect(mois1.baseFixe).toBe(30_000);
    expect(mois1.primePerformance).toBeCloseTo(9_000);
    expect(mois1.commissionAcquisition).toBeCloseTo(450);
  });

  it("month 4: payment is out of scope -> pure margin for the cabinet", () => {
    expect(mois4.encaisse).toBe(50_000);
    expect(mois4.commissionPerimetre).toBeCloseTo(0);
    expect(mois4.commissionHorsPerimetre).toBeCloseTo(1_500);
    // Only the two base fixes are still paid.
    expect(mois4.depensesPaie).toBe(30_000);
  });

  it("returns 0 income and only base fixes for an empty period", () => {
    const [vide] = computeProfitability(INPUT, ["2025-02"]);
    expect(vide.encaisse).toBe(0);
    expect(vide.commissionCabinet).toBe(0);
    expect(vide.net).toBe(-30_000);
  });
});

describe("computeCommercialProfitability", () => {
  it("compares what each commercial brings with what they cost", () => {
    const rows = computeCommercialProfitability(INPUT, "2025-01");
    const u1 = rows.find((r) => r.commercialId === "u-1");
    const u2 = rows.find((r) => r.commercialId === "u-2");
    expect(u1?.commissionCabinet).toBeCloseTo(4_500);
    expect(u1?.cout).toBeCloseTo(24_450);
    expect(u1?.net).toBeCloseTo(4_500 - 24_450);
    expect(u2?.commissionCabinet).toBe(0);
    expect(u2?.net).toBe(-15_000);
  });
});
