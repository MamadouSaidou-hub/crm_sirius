import { describe, expect, it } from "vitest";
import {
  ageContrat,
  calculerRemuneration,
  estEligible,
  type CalculerRemunerationInput,
  type ContratInput,
  type ProduitInput,
  type VersementInput,
} from "@/lib/payroll/engine";
import {
  OBJECTIF_MENSUEL_COMMERCIAL,
  PLAN_INITIAL,
  TAUX_CABINET_NSIA_VIE,
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
const BASE_FIXE = PLAN_INITIAL.baseFixe;

/** Runs the engine with the initial plan and the NSIA life rate unless overridden. */
function calc(
  input: Omit<CalculerRemunerationInput, "plan" | "tauxCabinet"> &
    Partial<Pick<CalculerRemunerationInput, "plan" | "tauxCabinet">>,
) {
  return calculerRemuneration({
    plan: PLAN_INITIAL,
    tauxCabinet: () => TAUX_CABINET_NSIA_VIE,
    ...input,
  });
}

function versement(
  id: string,
  contratId: string,
  periode: string,
  montant: number,
  estSouscription = false,
): VersementInput {
  return { id, contratId, periode, montant, estSouscription };
}

describe("initial configuration", () => {
  it("keeps the agreed values", () => {
    expect(PLAN_INITIAL).toEqual({
      baseFixe: 15_000,
      tauxPerformance: 0.06,
      tauxRetrocession: 0.1,
      dureeMois: 3,
    });
    expect(TAUX_CABINET_NSIA_VIE).toBe(0.03);
    expect(OBJECTIF_MENSUEL_COMMERCIAL).toBe(500_000);
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
  it("is true only for ages 1 to dureeMois", () => {
    expect(estEligible(0, 3)).toBe(false);
    expect(estEligible(1, 3)).toBe(true);
    expect(estEligible(3, 3)).toBe(true);
    expect(estEligible(4, 3)).toBe(false);
  });

  it("follows the duration it is given", () => {
    expect(estEligible(3, 2)).toBe(false);
    expect(estEligible(6, 6)).toBe(true);
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
    calc({
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

describe("calculerRemuneration — rates come from the inputs, not from constants", () => {
  const contrat: ContratInput = {
    id: "c-1",
    commercialId: COMMERCIAL,
    produitId: LIBRE_RETRAITE.id,
    dateSignature: "2025-01-10",
    souscriptionMontant: 0,
    cotisationReference: 100_000,
  };
  const base = {
    commercialId: COMMERCIAL,
    periode: "2025-01",
    contrats: [contrat],
    versements: [versement("v", "c-1", "2025-01", 100_000)],
    produits: [LIBRE_RETRAITE],
  };

  it("a negotiated cabinet rate flows into the acquisition commission", () => {
    // 4 % cabinet x 10 % retrocession = 0.4 % of 100 000 = 400
    const result = calc({ ...base, tauxCabinet: () => 0.04 });
    expect(result.contrats[0]?.tauxCommission).toBeCloseTo(0.004);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(400);
  });

  it("each contract uses its own cabinet rate", () => {
    const second: ContratInput = { ...contrat, id: "c-2" };
    const result = calc({
      ...base,
      contrats: [contrat, second],
      versements: [
        versement("v1", "c-1", "2025-01", 100_000),
        versement("v2", "c-2", "2025-01", 100_000),
      ],
      tauxCabinet: (id) => (id === "c-1" ? 0.03 : 0.1),
    });
    // 100 000 x 3 % x 10 % + 100 000 x 10 % x 10 % = 300 + 1 000
    expect(result.commissionAcquisitionTotale).toBeCloseTo(1_300);
  });

  it("a different plan changes base fixe, bonus and eligibility window", () => {
    const result = calc({
      ...base,
      periode: "2025-03",
      versements: [versement("v", "c-1", "2025-03", 100_000)],
      plan: {
        baseFixe: 20_000,
        tauxPerformance: 0.1,
        tauxRetrocession: 0.2,
        dureeMois: 2,
      },
    });
    // Age 3 > 2 months: out of scope -> only the new base fixe.
    expect(result.contrats[0]?.eligible).toBe(false);
    expect(result.total).toBe(20_000);
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

  const run = (periode: string, versements: VersementInput[], c = contrat) =>
    calc({
      commercialId: COMMERCIAL,
      periode,
      contrats: [c],
      versements,
      produits: [RETRAITE_SIMPLE],
    });

  it("month 1: frozen basis = subscription + reference contribution", () => {
    const result = run("2025-05", [versement("v1", "c-2", "2025-05", 20_000)]);
    expect(result.contrats[0]?.assiette).toBe(20_000);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(60);
  });

  it("month 2: basis stays frozen even if the actual payment differs", () => {
    const result = run("2025-06", [versement("v2", "c-2", "2025-06", 99_999)]);
    expect(result.contrats[0]?.assiette).toBe(20_000);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(60);
    // Production still reflects what was actually received.
    expect(result.production).toBe(99_999);
  });

  it("month 2 with no payment at all: commission still computed, production is 0", () => {
    const result = run("2025-06", []);
    expect(result.contrats[0]?.assiette).toBe(20_000);
    expect(result.commissionAcquisitionTotale).toBeCloseTo(60);
    expect(result.production).toBe(0);
    expect(result.primePerformance).toBe(0);
    expect(result.total).toBeCloseTo(BASE_FIXE + 60);
  });

  it("month 1 with a subscription: basis includes the subscription", () => {
    const result = run("2025-05", [], { ...contrat, souscriptionMontant: 30_000 });
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

    const result = calc({
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
      calc({
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
    const result = calc({
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
