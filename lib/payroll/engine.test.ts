import { describe, expect, it } from "vitest";
import {
  ageContrat,
  calculerRemuneration,
  estEligible,
  type ContratInput,
  type ProduitInput,
  type VersementInput,
} from "@/lib/payroll/engine";
import {
  BASE_FIXE,
  OBJECTIF_MENSUEL_COMMERCIAL,
  TAUX_COMMISSION_ACQUISITION,
} from "@/lib/payroll/config";

const LIBRE_RETRAITE: ProduitInput = {
  id: "p-libre",
  assietteType: "VARIABLE",
  frequenceCotisation: "mensuelle",
};

const RETRAITE_SIMPLE: ProduitInput = {
  id: "p-simple",
  assietteType: "FIGEE",
  frequenceCotisation: "mensuelle",
};

const COMMERCIAL = "u-1";

function versement(
  id: string,
  contratId: string,
  periode: string,
  montant: number,
  estSouscription = false,
): VersementInput {
  return { id, contratId, periode, montant, estSouscription };
}

describe("config", () => {
  it("keeps the agreed constants", () => {
    expect(BASE_FIXE).toBe(15_000);
    expect(OBJECTIF_MENSUEL_COMMERCIAL).toBe(500_000);
    expect(TAUX_COMMISSION_ACQUISITION).toBeCloseTo(0.003);
  });
});

describe("ageContrat", () => {
  it("counts the signature month as age 1", () => {
    expect(ageContrat("2025-01", "2025-01-15")).toBe(1);
    expect(ageContrat("2025-02", "2025-01-15")).toBe(2);
    expect(ageContrat("2025-03", "2025-01-15")).toBe(3);
    expect(ageContrat("2025-04", "2025-01-15")).toBe(4);
  });

  it("handles a year rollover", () => {
    expect(ageContrat("2026-01", "2025-12-01")).toBe(2);
  });

  it("returns <= 0 for a contract signed after the period", () => {
    expect(ageContrat("2025-01", "2025-02-01")).toBe(0);
  });
});

describe("estEligible", () => {
  it("is true only for ages 1 to 3", () => {
    expect(estEligible(0)).toBe(false);
    expect(estEligible(1)).toBe(true);
    expect(estEligible(2)).toBe(true);
    expect(estEligible(3)).toBe(true);
    expect(estEligible(4)).toBe(false);
  });
});

describe("calculerRemuneration — Libre retraite (reference case)", () => {
  const contrat: ContratInput = {
    id: "c-1",
    commercialId: COMMERCIAL,
    produitId: LIBRE_RETRAITE.id,
    dateSignature: "2025-01-10",
    souscriptionMontant: 100_000,
    cotisationReference: 50_000,
  };

  const run = (periode: string, versements: VersementInput[]) =>
    calculerRemuneration({
      commercialId: COMMERCIAL,
      periode,
      contrats: [contrat],
      versements,
      produits: [LIBRE_RETRAITE],
    });

  it("month 1: 150 000 paid -> bonus 9 000, acquisition 450, total 24 450", () => {
    const result = run("2025-01", [
      versement("v1", "c-1", "2025-01", 100_000, true),
      versement("v2", "c-1", "2025-01", 50_000),
    ]);
    expect(result.production).toBe(150_000);
    expect(result.primePerformance).toBeCloseTo(9_000);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(450);
    expect(result.total).toBeCloseTo(24_450);
  });

  it.each(["2025-02", "2025-03"])(
    "%s: minimum payment 50 000 -> bonus 3 000, acquisition 150, total 18 150",
    (periode) => {
      const result = run(periode, [versement("v", "c-1", periode, 50_000)]);
      expect(result.production).toBe(50_000);
      expect(result.primePerformance).toBeCloseTo(3_000);
      expect(result.commissionAcquisitionTotale).toBeCloseTo(150);
      expect(result.total).toBeCloseTo(18_150);
    },
  );

  it("month 4 onward: contract leaves the scope, only the base fixe remains", () => {
    // Even if a payment is received, it must not count once age > 3.
    const result = run("2025-04", [versement("v", "c-1", "2025-04", 50_000)]);
    expect(result.production).toBe(0);
    expect(result.primePerformance).toBe(0);
    expect(result.commissionAcquisitionTotale).toBe(0);
    expect(result.total).toBe(BASE_FIXE);
    expect(result.contrats[0]?.eligible).toBe(false);
    expect(result.contrats[0]?.motifExclusion).toMatch(/périmètre/);
  });

  it("before the signature month: excluded as not yet signed", () => {
    const result = run("2024-12", []);
    expect(result.contrats[0]?.eligible).toBe(false);
    expect(result.contrats[0]?.motifExclusion).toMatch(/pas encore signé/);
    expect(result.total).toBe(BASE_FIXE);
  });
});

describe("calculerRemuneration — FIGEE product (Retraite simple)", () => {
  const contrat: ContratInput = {
    id: "c-2",
    commercialId: COMMERCIAL,
    produitId: RETRAITE_SIMPLE.id,
    dateSignature: "2025-05-05",
    souscriptionMontant: 0,
    cotisationReference: 20_000,
  };

  it("month 1: frozen basis = subscription + reference contribution", () => {
    const result = calculerRemuneration({
      commercialId: COMMERCIAL,
      periode: "2025-05",
      contrats: [contrat],
      versements: [versement("v1", "c-2", "2025-05", 20_000)],
      produits: [RETRAITE_SIMPLE],
    });
    expect(result.contrats[0]?.assiette).toBe(20_000);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(60);
  });

  it("month 2: basis stays frozen even if the actual payment differs", () => {
    const result = calculerRemuneration({
      commercialId: COMMERCIAL,
      periode: "2025-06",
      contrats: [contrat],
      versements: [versement("v2", "c-2", "2025-06", 99_999)],
      produits: [RETRAITE_SIMPLE],
    });
    expect(result.contrats[0]?.assiette).toBe(20_000);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(60);
    // Production still reflects what was actually received.
    expect(result.production).toBe(99_999);
  });

  it("month 2 with no payment at all: commission still computed, production is 0", () => {
    const result = calculerRemuneration({
      commercialId: COMMERCIAL,
      periode: "2025-06",
      contrats: [contrat],
      versements: [],
      produits: [RETRAITE_SIMPLE],
    });
    expect(result.contrats[0]?.assiette).toBe(20_000);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(60);
    expect(result.production).toBe(0);
    expect(result.primePerformance).toBe(0);
    expect(result.total).toBeCloseTo(BASE_FIXE + 60);
  });

  it("month 1 with a subscription: basis includes the subscription", () => {
    const withSub: ContratInput = { ...contrat, souscriptionMontant: 30_000 };
    const result = calculerRemuneration({
      commercialId: COMMERCIAL,
      periode: "2025-05",
      contrats: [withSub],
      versements: [],
      produits: [RETRAITE_SIMPLE],
    });
    expect(result.contrats[0]?.assiette).toBe(50_000);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(150);
  });
});

describe("calculerRemuneration — multiple contracts", () => {
  it("excludes an old contract (> 3 months) and includes a new one", () => {
    const ancien: ContratInput = {
      id: "c-old",
      commercialId: COMMERCIAL,
      produitId: LIBRE_RETRAITE.id,
      dateSignature: "2024-01-01",
      souscriptionMontant: 100_000,
      cotisationReference: 50_000,
    };
    const nouveau: ContratInput = {
      ...ancien,
      id: "c-new",
      dateSignature: "2025-01-10",
    };

    const result = calculerRemuneration({
      commercialId: COMMERCIAL,
      periode: "2025-01",
      contrats: [ancien, nouveau],
      versements: [
        // Payment on the old contract must be ignored entirely.
        versement("v1", "c-old", "2025-01", 999_999),
        versement("v2", "c-new", "2025-01", 100_000, true),
        versement("v3", "c-new", "2025-01", 50_000),
      ],
      produits: [LIBRE_RETRAITE],
    });

    const old = result.contrats.find((c) => c.contratId === "c-old");
    const fresh = result.contrats.find((c) => c.contratId === "c-new");
    expect(old?.eligible).toBe(false);
    expect(old?.production).toBe(0);
    expect(fresh?.eligible).toBe(true);
    expect(result.production).toBe(150_000);
    expect(result.primePerformance).toBeCloseTo(9_000);
  });

  it("throws a clear error when the product is unknown", () => {
    expect(() =>
      calculerRemuneration({
        commercialId: COMMERCIAL,
        periode: "2025-01",
        contrats: [
          {
            id: "c-x",
            commercialId: COMMERCIAL,
            produitId: "missing",
            dateSignature: "2025-01-01",
            souscriptionMontant: 0,
            cotisationReference: 1_000,
          },
        ],
        versements: [],
        produits: [],
      }),
    ).toThrow(/Produit introuvable/);
  });
});

describe("calculerRemuneration — base fixe always guaranteed", () => {
  it("returns the base fixe with no contract and no payment", () => {
    const result = calculerRemuneration({
      commercialId: COMMERCIAL,
      periode: "2025-01",
      contrats: [],
      versements: [],
      produits: [],
    });
    expect(result.production).toBe(0);
    expect(result.primePerformance).toBe(0);
    expect(result.commissionAcquisitionTotale).toBe(0);
    expect(result.total).toBe(BASE_FIXE);
  });
});
