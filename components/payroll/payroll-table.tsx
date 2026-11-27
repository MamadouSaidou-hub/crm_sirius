"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type {
  PayrollContract,
  PayrollLine,
  PayrollPolicy,
  PayrollProduct,
} from "@/lib/data/payroll";
import { OBJECTIF_MENSUEL_COMMERCIAL } from "@/lib/payroll/config";
import type { RemunerationPlan } from "@/lib/payroll/rates";
import { formatRate } from "@/components/payroll/payroll-explainer";
import { attainment } from "@/lib/data/performance";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn, formatNumber } from "@/lib/utils";

interface PayrollTableProps {
  lines: PayrollLine[];
  contracts: PayrollContract[];
  policies: PayrollPolicy[];
  products: PayrollProduct[];
  /** Plan in force for the displayed period. */
  plan: RemunerationPlan;
}

/** 1 500 000 -> "1,5 M", 500 000 -> "500 K" (unit is shown once, in the caption). */
function short(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M`;
  }
  if (amount >= 1_000) return `${Math.round(amount / 1_000)} K`;
  return String(Math.round(amount));
}

/** Percentage + bar toward the monthly objective (the bar stops at 100 %). */
function ObjectiveCell({ production }: { production: number }) {
  const pct = attainment(production, OBJECTIF_MENSUEL_COMMERCIAL);
  const reached = pct >= 100;
  return (
    <div className="min-w-[150px] space-y-1">
      <div className="flex items-center justify-between gap-2 text-xs">
        <span
          className={cn(
            "font-semibold",
            reached ? "text-sirius-success" : "text-sirius-gold",
          )}
        >
          {pct} %
        </span>
        <span className="text-muted-foreground">
          {short(production)} / {short(OBJECTIF_MENSUEL_COMMERCIAL)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
        <div
          className={cn(
            "h-full rounded-full",
            reached ? "bg-sirius-success" : "bg-sirius-gold",
          )}
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
    </div>
  );
}

const TH = "px-2 py-1 text-xs font-medium text-muted-foreground";
const TD = "px-2 py-1.5";

/** One row per commercial, expandable to the breakdown by kind of business. */
export function PayrollTable({
  lines,
  contracts,
  policies,
  products,
  plan,
}: PayrollTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const contractById = new Map(contracts.map((c) => [c.id, c]));
  const policyById = new Map(policies.map((p) => [p.id, p]));
  const productById = new Map(products.map((p) => [p.id, p]));

  // Hide columns that carry no information this month.
  const showPrime = lines.some((l) => l.primePerformance > 0);
  const showIard = lines.some((l) => l.polices.length > 0);
  const columnCount = 6 + (showPrime ? 1 : 0) + (showIard ? 1 : 0);

  return (
    <div className="space-y-1.5">
      <p className="text-right text-xs text-muted-foreground">
        Montants en FCFA
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Commercial</TableHead>
              <TableHead className="text-right">Production</TableHead>
              <TableHead>Objectif</TableHead>
              <TableHead className="text-right">Base fixe</TableHead>
              {showPrime && <TableHead className="text-right">Prime</TableHead>}
              <TableHead className="text-right">Commissions vie</TableHead>
              {showIard && (
                <TableHead className="text-right">Commissions IARD</TableHead>
              )}
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lines.map((line) => {
              const open = openId === line.commercialId;
              return (
                <Fragment key={line.commercialId}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => setOpenId(open ? null : line.commercialId)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {open ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <UserAvatar
                          name={line.commercial.name}
                          role="commercial"
                          className="h-7 w-7"
                        />
                        <span className="font-medium">{line.commercial.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(line.production)}
                    </TableCell>
                    <TableCell>
                      <ObjectiveCell production={line.production} />
                    </TableCell>
                    <TableCell className="text-right">
                      {formatNumber(line.baseFixe)}
                    </TableCell>
                    {showPrime && (
                      <TableCell className="text-right">
                        {formatNumber(line.primePerformance)}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {formatNumber(line.commissionAcquisitionTotale)}
                    </TableCell>
                    {showIard && (
                      <TableCell className="text-right">
                        {formatNumber(line.commissionPolices)}
                      </TableCell>
                    )}
                    <TableCell className="text-right font-semibold">
                      {formatNumber(line.total)}
                    </TableCell>
                  </TableRow>

                  {open && (
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableCell colSpan={columnCount} className="p-4">
                        {line.contrats.length === 0 && line.polices.length === 0 ? (
                          <p className="text-sm text-muted-foreground">
                            Aucun contrat ni police ce mois — seule la base fixe
                            est garantie.
                          </p>
                        ) : (
                          <div className="space-y-5">
                            {line.contrats.length > 0 && (
                              <section>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  Vie / Retraite
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[520px] text-sm">
                                    <thead>
                                      <tr>
                                        <th className={cn(TH, "text-left")}>Client</th>
                                        <th className={cn(TH, "text-left")}>Mois</th>
                                        <th className={cn(TH, "text-right")}>Base</th>
                                        <th className={cn(TH, "text-right")}>Taux effectif</th>
                                        <th className={cn(TH, "text-right")}>Commission</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {line.contrats.map((detail) => (
                                        <tr
                                          key={detail.contratId}
                                          className="border-t border-border/50"
                                        >
                                          <td className={cn(TD, "font-medium")}>
                                            {contractById.get(detail.contratId)
                                              ?.clientName ?? "Contrat"}
                                          </td>
                                          {detail.eligible ? (
                                            <>
                                              <td className={TD}>
                                                <Badge variant="outline">
                                                  {detail.age}/{plan.dureeMois}
                                                </Badge>
                                              </td>
                                              <td className={cn(TD, "text-right")}>
                                                {formatNumber(detail.assiette)}
                                              </td>
                                              <td className={cn(TD, "text-right text-muted-foreground")}>
                                                {formatRate(detail.tauxCommission)}
                                              </td>
                                              <td className={cn(TD, "text-right font-semibold")}>
                                                {formatNumber(detail.commissionAcquisition)}
                                              </td>
                                            </>
                                          ) : (
                                            <td
                                              colSpan={4}
                                              className={cn(TD, "text-muted-foreground")}
                                            >
                                              {detail.motifExclusion}
                                            </td>
                                          )}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </section>
                            )}

                            {line.polices.length > 0 && (
                              <section>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                  IARD
                                </h4>
                                <div className="overflow-x-auto">
                                  <table className="w-full min-w-[640px] text-sm">
                                    <thead>
                                      <tr>
                                        <th className={cn(TH, "text-left")}>Assuré</th>
                                        <th className={cn(TH, "text-left")}>Produit</th>
                                        <th className={cn(TH, "text-right")}>Base</th>
                                        <th className={cn(TH, "text-right")}>Taux cabinet</th>
                                        <th className={cn(TH, "text-right")}>Commission cabinet</th>
                                        <th className={cn(TH, "text-right")}>Part commercial</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {line.polices.map((police) => {
                                        const policy = policyById.get(police.policyId);
                                        return (
                                          <tr
                                            key={police.policyId}
                                            className="border-t border-border/50"
                                          >
                                            <td className={cn(TD, "font-medium")}>
                                              {policy?.clientName ?? "Police"}
                                              {policy?.reference && (
                                                <span className="block text-xs font-normal text-muted-foreground">
                                                  {policy.reference}
                                                </span>
                                              )}
                                            </td>
                                            <td className={TD}>
                                              {policy
                                                ? (productById.get(policy.produitId)?.label ?? "—")
                                                : "—"}
                                            </td>
                                            <td className={cn(TD, "text-right")}>
                                              {formatNumber(police.assiette)}
                                            </td>
                                            <td className={cn(TD, "text-right text-muted-foreground")}>
                                              {formatRate(police.tauxCabinet)}
                                              {police.partAccessoires > 0 &&
                                                ` + ${formatRate(police.partAccessoires)} acc.`}
                                            </td>
                                            <td className={cn(TD, "text-right")}>
                                              {formatNumber(police.commissionCabinet)}
                                            </td>
                                            <td className={cn(TD, "text-right font-semibold")}>
                                              {formatNumber(police.commissionCommercial)}
                                              <span className="block text-xs font-normal text-muted-foreground">
                                                {formatRate(police.retrocession)}
                                              </span>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </section>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
