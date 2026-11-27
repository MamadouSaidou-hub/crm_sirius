/**
 * CSV export of a month's payroll, readable by Excel (French locale: ';'
 * separator, UTF-8 with BOM added by the downloader). Pure and DB-free.
 */

import type { RemunerationResult } from "@/lib/payroll/engine";

const SEPARATOR = ";";
const NEWLINE = "\r\n";

/**
 * One CSV cell. Text starting with = + - @ (or a tab/CR) would be run as a
 * formula by Excel ("CSV injection"): the cell is neutralised with a leading
 * apostrophe. Numbers are written as plain integers.
 */
export function csvCell(value: string | number): string {
  if (typeof value === "number") return String(Math.round(value));
  let text = value;
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[;"\r\n]/.test(text)) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

function row(cells: Array<string | number>): string {
  return cells.map(csvCell).join(SEPARATOR);
}

/** 0.2 -> "20 %" */
function percent(rate: number): string {
  return `${(rate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

export interface PayrollExportLine extends RemunerationResult {
  commercialName: string;
}

export interface PayrollExportInput {
  period: string;
  lines: PayrollExportLine[];
  /** Display names, looked up by id. */
  contractName: (contratId: string) => string;
  policyName: (policyId: string) => string;
}

/** Summary per commercial, then life detail, then IARD detail. */
export function buildPayrollCsv(input: PayrollExportInput): string {
  const { period, lines } = input;
  const out: string[] = [];

  out.push(row([`Paie des commerciaux — ${period}`]));
  out.push(row(["Montants en FCFA"]));
  out.push("");

  out.push(row(["RÉCAPITULATIF"]));
  out.push(
    row([
      "Commercial",
      "Production",
      "Base fixe",
      "Prime",
      "Commissions vie",
      "Commissions IARD",
      "Total",
    ]),
  );
  for (const l of lines) {
    out.push(
      row([
        l.commercialName,
        l.production,
        l.baseFixe,
        l.primePerformance,
        l.commissionAcquisitionTotale,
        l.commissionPolices,
        l.total,
      ]),
    );
  }
  const sum = (pick: (l: PayrollExportLine) => number) =>
    lines.reduce((s, l) => s + pick(l), 0);
  out.push(
    row([
      "TOTAL",
      sum((l) => l.production),
      sum((l) => l.baseFixe),
      sum((l) => l.primePerformance),
      sum((l) => l.commissionAcquisitionTotale),
      sum((l) => l.commissionPolices),
      sum((l) => l.total),
    ]),
  );

  const vie = lines.flatMap((l) =>
    l.contrats
      .filter((c) => c.eligible)
      .map((c) => ({ l, c })),
  );
  if (vie.length > 0) {
    out.push("");
    out.push(row(["DÉTAIL VIE / RETRAITE"]));
    out.push(
      row(["Commercial", "Client", "Mois du contrat", "Base", "Taux effectif", "Commission"]),
    );
    for (const { l, c } of vie) {
      out.push(
        row([
          l.commercialName,
          input.contractName(c.contratId),
          c.age,
          c.assiette,
          percent(c.tauxCommission),
          c.commissionAcquisition,
        ]),
      );
    }
  }

  const iard = lines.flatMap((l) => l.polices.map((p) => ({ l, p })));
  if (iard.length > 0) {
    out.push("");
    out.push(row(["DÉTAIL IARD"]));
    out.push(
      row([
        "Commercial",
        "Assuré",
        "Base",
        "Taux cabinet",
        "Part des accessoires",
        "Commission cabinet",
        "Rétrocession",
        "Part commercial",
      ]),
    );
    for (const { l, p } of iard) {
      out.push(
        row([
          l.commercialName,
          input.policyName(p.policyId),
          p.assiette,
          percent(p.tauxCabinet),
          percent(p.partAccessoires),
          p.commissionCabinet,
          percent(p.retrocession),
          p.commissionCommercial,
        ]),
      );
    }
  }

  return out.join(NEWLINE) + NEWLINE;
}
