"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { PayrollContract, PayrollLine } from "@/lib/data/payroll";
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
import { cn, formatFCFA } from "@/lib/utils";

interface PayrollTableProps {
  lines: PayrollLine[];
  contracts: PayrollContract[];
  /** Plan in force for the displayed period. */
  plan: RemunerationPlan;
}

/** One row per commercial, expandable to the per-contract breakdown. */
export function PayrollTable({ lines, contracts, plan }: PayrollTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const contractById = new Map(contracts.map((c) => [c.id, c]));

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Commercial</TableHead>
            <TableHead className="text-right">Production</TableHead>
            <TableHead className="text-right">Objectif</TableHead>
            <TableHead className="text-right">Base fixe</TableHead>
            <TableHead className="text-right">
              Prime ({formatRate(plan.tauxPerformance)})
            </TableHead>
            <TableHead className="text-right">Commissions</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lines.map((line) => {
            const open = openId === line.commercialId;
            const pct = attainment(line.production, OBJECTIF_MENSUEL_COMMERCIAL);
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
                    {formatFCFA(line.production)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={cn(
                        "font-semibold",
                        pct >= 100 ? "text-sirius-success" : "text-sirius-gold",
                      )}
                    >
                      {pct}%
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatFCFA(line.baseFixe)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatFCFA(line.primePerformance)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatFCFA(line.commissionAcquisitionTotale)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatFCFA(line.total)}
                  </TableCell>
                </TableRow>

                {open && (
                  <TableRow className="bg-muted/30 hover:bg-muted/30">
                    <TableCell colSpan={7} className="p-4">
                      {line.contrats.length === 0 ? (
                        <p className="text-sm text-muted-foreground">
                          Aucun contrat — seule la base fixe est garantie.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {line.contrats.map((detail) => (
                            <li
                              key={detail.contratId}
                              className="flex flex-wrap items-center justify-between gap-2 text-sm"
                            >
                              <span className="font-medium">
                                {contractById.get(detail.contratId)?.clientName ??
                                  "Contrat"}
                              </span>
                              {detail.eligible ? (
                                <span className="flex flex-wrap items-center gap-3 text-muted-foreground">
                                  <Badge variant="outline">
                                    Mois {detail.age}/{plan.dureeMois}
                                  </Badge>
                                  <span>
                                    Production {formatFCFA(detail.production)}
                                  </span>
                                  <span className="text-foreground">
                                    Commission : {formatFCFA(detail.assiette)}{" "}
                                    × {formatRate(detail.tauxCommission)}{" "}
                                    = {formatFCFA(detail.commissionAcquisition)}
                                  </span>
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  {detail.motifExclusion}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
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
  );
}
