"use client";

import { Printer } from "lucide-react";
import type {
  PayrollContract,
  PayrollLine,
  PayrollPolicy,
  PayrollProduct,
} from "@/lib/data/payroll";
import { OBJECTIF_MENSUEL_COMMERCIAL } from "@/lib/payroll/config";
import { attainment } from "@/lib/data/performance";
import { formatRate } from "@/components/payroll/payroll-explainer";
import { formatFCFA } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PayslipDialogProps {
  /** The commercial's line; null keeps the dialog closed. */
  line: PayrollLine | null;
  period: string;
  contracts: PayrollContract[];
  policies: PayrollPolicy[];
  products: PayrollProduct[];
  onClose: () => void;
}

/** "2026-11" -> "novembre 2026" */
function monthLabel(period: string): string {
  return new Date(`${period}-01T12:00:00`).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });
}

const CELL = "border-b border-neutral-200 px-2 py-1.5";

/**
 * Payslip of one commercial for one month. It is laid out as a white A4 sheet;
 * "Imprimer / PDF" prints only that sheet (see the print rules in globals.css),
 * and the browser's "Save as PDF" produces the file.
 */
export function PayslipDialog({
  line,
  period,
  contracts,
  policies,
  products,
  onClose,
}: PayslipDialogProps) {
  const contractById = new Map(contracts.map((c) => [c.id, c]));
  const policyById = new Map(policies.map((p) => [p.id, p]));
  const productById = new Map(products.map((p) => [p.id, p]));

  return (
    <Dialog open={line !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        {line && (
          <>
            <DialogHeader className="flex-row items-center justify-between space-y-0 pr-8">
              <DialogTitle>Bulletin de rémunération</DialogTitle>
              <Button size="sm" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Imprimer / PDF
              </Button>
            </DialogHeader>

            <div className="payslip-print overflow-x-auto rounded-md bg-white p-4 text-sm text-black sm:p-8">
              <header className="flex items-start justify-between border-b-2 border-neutral-800 pb-4">
                <div>
                  <p className="text-xl font-bold tracking-wide">
                    SIRIUS <span className="text-sky-600">ASSURANCES</span>
                  </p>
                  <p className="text-xs text-neutral-500">
                    Cabinet de courtage agréé — Dakar, Sénégal
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold">
                    Bulletin de rémunération
                  </p>
                  <p className="capitalize">{monthLabel(period)}</p>
                </div>
              </header>

              <section className="grid grid-cols-2 gap-4 py-4">
                <div>
                  <p className="text-xs uppercase text-neutral-500">Commercial</p>
                  <p className="text-base font-semibold">{line.commercial.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase text-neutral-500">Production du mois</p>
                  <p className="font-semibold">
                    {formatFCFA(line.production)} sur{" "}
                    {formatFCFA(OBJECTIF_MENSUEL_COMMERCIAL)}{" "}
                    <span className="text-neutral-500">
                      ({attainment(line.production, OBJECTIF_MENSUEL_COMMERCIAL)} %)
                    </span>
                  </p>
                </div>
              </section>

              <table className="w-full">
                <thead>
                  <tr className="bg-neutral-100 text-left text-xs uppercase text-neutral-600">
                    <th className="px-2 py-1.5">Rubrique</th>
                    <th className="px-2 py-1.5 text-right">Montant</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={CELL}>Base fixe</td>
                    <td className={`${CELL} text-right`}>{formatFCFA(line.baseFixe)}</td>
                  </tr>
                  {line.primePerformance > 0 && (
                    <tr>
                      <td className={CELL}>Prime de performance</td>
                      <td className={`${CELL} text-right`}>
                        {formatFCFA(line.primePerformance)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td className={CELL}>Commissions vie / retraite</td>
                    <td className={`${CELL} text-right`}>
                      {formatFCFA(line.commissionAcquisitionTotale)}
                    </td>
                  </tr>
                  <tr>
                    <td className={CELL}>Commissions IARD</td>
                    <td className={`${CELL} text-right`}>
                      {formatFCFA(line.commissionPolices)}
                    </td>
                  </tr>
                  <tr className="bg-neutral-100 text-base font-bold">
                    <td className="px-2 py-2">NET À PAYER</td>
                    <td className="px-2 py-2 text-right">{formatFCFA(line.total)}</td>
                  </tr>
                </tbody>
              </table>

              {line.contrats.some((c) => c.eligible) && (
                <section className="mt-6">
                  <h3 className="mb-1 text-xs font-semibold uppercase text-neutral-600">
                    Détail vie / retraite
                  </h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-neutral-500">
                        <th className="px-2 py-1">Client</th>
                        <th className="px-2 py-1 text-right">Base</th>
                        <th className="px-2 py-1 text-right">Taux</th>
                        <th className="px-2 py-1 text-right">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {line.contrats
                        .filter((c) => c.eligible)
                        .map((c) => (
                          <tr key={c.contratId}>
                            <td className={CELL}>
                              {contractById.get(c.contratId)?.clientName ?? "Contrat"}
                            </td>
                            <td className={`${CELL} text-right`}>{formatFCFA(c.assiette)}</td>
                            <td className={`${CELL} text-right`}>
                              {formatRate(c.tauxCommission)}
                            </td>
                            <td className={`${CELL} text-right`}>
                              {formatFCFA(c.commissionAcquisition)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </section>
              )}

              {line.polices.length > 0 && (
                <section className="mt-6">
                  <h3 className="mb-1 text-xs font-semibold uppercase text-neutral-600">
                    Détail IARD
                  </h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left text-neutral-500">
                        <th className="px-2 py-1">Assuré</th>
                        <th className="px-2 py-1">Produit</th>
                        <th className="px-2 py-1 text-right">Commission cabinet</th>
                        <th className="px-2 py-1 text-right">Votre part</th>
                      </tr>
                    </thead>
                    <tbody>
                      {line.polices.map((p) => {
                        const policy = policyById.get(p.policyId);
                        return (
                          <tr key={p.policyId}>
                            <td className={CELL}>{policy?.clientName ?? "Police"}</td>
                            <td className={CELL}>
                              {policy
                                ? (productById.get(policy.produitId)?.label ?? "—")
                                : "—"}
                            </td>
                            <td className={`${CELL} text-right`}>
                              {formatFCFA(p.commissionCabinet)}
                            </td>
                            <td className={`${CELL} text-right`}>
                              {formatFCFA(p.commissionCommercial)}{" "}
                              <span className="text-neutral-500">
                                ({formatRate(p.retrocession)})
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </section>
              )}

              <footer className="mt-8 border-t border-neutral-300 pt-3 text-xs text-neutral-500">
                Document généré par Sirius CRM le{" "}
                {new Date().toLocaleDateString("fr-FR")}. Les commissions vie
                sont dues pendant les premiers mois du contrat ; les polices IARD
                sont commissionnées une seule fois, le mois de leur date
                d&apos;effet.
              </footer>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
