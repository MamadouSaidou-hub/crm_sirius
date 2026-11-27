import { describe, expect, it } from "vitest";
import {
  buildPayrollCsv,
  csvCell,
  type PayrollExportLine,
} from "@/lib/payroll/export";

describe("csvCell", () => {
  it("writes numbers as plain integers", () => {
    expect(csvCell(1234.56)).toBe("1235");
    expect(csvCell(-500)).toBe("-500");
  });

  it("neutralises formulas typed by users (CSV injection)", () => {
    expect(csvCell("=SUM(A1:A9)")).toBe("'=SUM(A1:A9)");
    expect(csvCell("+221 77 000")).toBe("'+221 77 000");
    expect(csvCell("-1")).toBe("'-1");
    expect(csvCell("@cmd")).toBe("'@cmd");
  });

  it("quotes text containing the separator, quotes or line breaks", () => {
    expect(csvCell("Diop; Fils")).toBe('"Diop; Fils"');
    expect(csvCell('Le "Grand"')).toBe('"Le ""Grand"""');
    expect(csvCell("a\nb")).toBe('"a\nb"');
  });

  it("leaves ordinary text alone", () => {
    expect(csvCell("Moustapha Tall")).toBe("Moustapha Tall");
  });
});

function line(over: Partial<PayrollExportLine> = {}): PayrollExportLine {
  return {
    commercialId: "u-1",
    commercialName: "Awa Diop",
    periode: "2026-11",
    baseFixe: 15_000,
    production: 900_000,
    productionPolices: 0,
    primePerformance: 0,
    commissionAcquisitionTotale: 5_400,
    commissionPolices: 27_195,
    total: 47_595,
    contrats: [
      {
        contratId: "c-1",
        age: 1,
        eligible: true,
        motifExclusion: null,
        assiette: 700_000,
        tauxCommission: 0.006,
        commissionAcquisition: 4_200,
        production: 700_000,
        primePerformance: 0,
      },
    ],
    polices: [
      {
        policyId: "p-1",
        commercialId: "u-1",
        periode: "2026-11",
        base: "prime_nette",
        assiette: 295_500,
        tauxCabinet: 0.25,
        partAccessoires: 1,
        accessoires: 3_000,
        production: 300_000,
        commissionCabinet: 76_875,
        retrocession: 0.2,
        commissionCommercial: 15_375,
      },
    ],
    ...over,
  };
}

describe("buildPayrollCsv", () => {
  const csv = buildPayrollCsv({
    period: "2026-11",
    lines: [line(), line({ commercialId: "u-2", commercialName: "=Pirate", total: 15_000, commissionPolices: 0, commissionAcquisitionTotale: 0, contrats: [], polices: [] })],
    contractName: () => "clienttest1",
    policyName: () => "Imam Said",
  });
  const rows = csv.split("\r\n");

  it("has a summary with one row per commercial and a total", () => {
    expect(rows).toContain("Awa Diop;900000;15000;0;5400;27195;47595");
    expect(rows.find((r) => r.startsWith("TOTAL"))).toBe("TOTAL;1800000;30000;0;5400;27195;62595");
  });

  it("neutralises a malicious name", () => {
    expect(rows.some((r) => r.startsWith("'=Pirate"))).toBe(true);
    expect(rows.some((r) => r.startsWith("=Pirate"))).toBe(false);
  });

  it("lists the life and IARD detail", () => {
    expect(csv).toContain("DÉTAIL VIE / RETRAITE");
    expect(rows).toContain("Awa Diop;clienttest1;1;700000;0,6 %;4200");
    expect(csv).toContain("DÉTAIL IARD");
    expect(rows).toContain("Awa Diop;Imam Said;295500;25 %;100 %;76875;20 %;15375");
  });

  it("omits detail sections when there is nothing to detail", () => {
    const empty = buildPayrollCsv({
      period: "2026-11",
      lines: [line({ contrats: [], polices: [] })],
      contractName: () => "",
      policyName: () => "",
    });
    expect(empty).not.toContain("DÉTAIL");
  });
});
