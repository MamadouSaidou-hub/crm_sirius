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
import { attainment } from "@/lib/data/performance";
import { LineDetail } from "@/components/payroll/line-detail";
import { PayslipDialog } from "@/components/payroll/payslip-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  /** Displayed month, 'YYYY-MM' (titles the payslip). */
  period: string;
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

/** Small label + value pair used in the phone cards. */
function Figure({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{formatNumber(value)}</dd>
    </div>
  );
}

/**
 * One row per commercial on tablet/desktop (a table), one card per commercial
 * on phones; both expand to the same breakdown by kind of business.
 */
export function PayrollTable({
  lines,
  contracts,
  policies,
  products,
  period,
  plan,
}: PayrollTableProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [payslipLine, setPayslipLine] = useState<PayrollLine | null>(null);
  const contractById = new Map(contracts.map((c) => [c.id, c]));
  const policyById = new Map(policies.map((p) => [p.id, p]));
  const productById = new Map(products.map((p) => [p.id, p]));

  // Hide columns that carry no information this month.
  const showPrime = lines.some((l) => l.primePerformance > 0);
  const showIard = lines.some((l) => l.polices.length > 0);
  const columnCount = 6 + (showPrime ? 1 : 0) + (showIard ? 1 : 0);

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  const detailOf = (line: PayrollLine) => (
    <LineDetail
      line={line}
      plan={plan}
      contractById={contractById}
      policyById={policyById}
      productById={productById}
      onPayslip={() => setPayslipLine(line)}
    />
  );

  return (
    <div className="space-y-1.5">
      <p className="text-right text-xs text-muted-foreground">Montants en FCFA</p>

      {/* Tablet and desktop: table */}
      <div className="hidden overflow-x-auto rounded-lg border border-border md:block">
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
                    onClick={() => toggle(line.commercialId)}
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
                        {detailOf(line)}
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Phone: one card per commercial */}
      <div className="space-y-3 md:hidden">
        {lines.map((line) => {
          const open = openId === line.commercialId;
          return (
            <Card key={line.commercialId}>
              <CardContent className="space-y-3 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2">
                    <UserAvatar
                      name={line.commercial.name}
                      role="commercial"
                      className="h-8 w-8"
                    />
                    <span className="truncate font-medium">
                      {line.commercial.name}
                    </span>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-semibold leading-tight">
                      {formatNumber(line.total)}
                    </p>
                    <p className="text-xs text-muted-foreground">à payer</p>
                  </div>
                </div>

                <ObjectiveCell production={line.production} />

                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <Figure label="Base fixe" value={line.baseFixe} />
                  {showPrime && <Figure label="Prime" value={line.primePerformance} />}
                  <Figure label="Commissions vie" value={line.commissionAcquisitionTotale} />
                  {showIard && (
                    <Figure label="Commissions IARD" value={line.commissionPolices} />
                  )}
                </dl>

                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => toggle(line.commercialId)}
                  aria-expanded={open}
                >
                  {open ? "Masquer le détail" : "Voir le détail"}
                </Button>
                {open && detailOf(line)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <PayslipDialog
        line={payslipLine}
        period={period}
        contracts={contracts}
        policies={policies}
        products={products}
        onClose={() => setPayslipLine(null)}
      />
    </div>
  );
}
