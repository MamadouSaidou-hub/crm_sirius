import type { User } from "@/lib/types";
import type { PayrollPolicy, PayrollProduct } from "@/lib/data/payroll";
import type { PolicyEvaluated } from "@/lib/payroll/policies";
import { fullDate } from "@/lib/date";
import { formatFCFA } from "@/lib/utils";
import { formatRate } from "@/components/payroll/payroll-explainer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface PoliciesTableProps {
  /** Policies taking effect in the selected month. */
  policies: PayrollPolicy[];
  evaluated: PolicyEvaluated[];
  products: PayrollProduct[];
  commercials: User[];
}

/** IARD policies of the month with the commission each one brings. */
export function PoliciesTable({
  policies,
  evaluated,
  products,
  commercials,
}: PoliciesTableProps) {
  const productById = new Map(products.map((p) => [p.id, p]));
  const commercialById = new Map(commercials.map((c) => [c.id, c]));
  const evaluatedById = new Map(evaluated.map((e) => [e.policyId, e]));

  const totalCabinet = policies.reduce(
    (sum, p) => sum + (evaluatedById.get(p.id)?.commissionCabinet ?? 0),
    0,
  );
  const totalCommercial = policies.reduce(
    (sum, p) => sum + (evaluatedById.get(p.id)?.commissionCommercial ?? 0),
    0,
  );

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Polices IARD du mois
      </h2>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date d&apos;effet</TableHead>
              <TableHead>Assuré</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Commercial</TableHead>
              <TableHead className="text-right">Prime nette</TableHead>
              <TableHead className="text-right">Commission cabinet</TableHead>
              <TableHead className="text-right">Part commercial</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {policies.map((policy) => {
              const result = evaluatedById.get(policy.id);
              return (
                <TableRow key={policy.id}>
                  <TableCell>{fullDate(`${policy.dateEffet}T12:00:00`)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{policy.clientName}</div>
                    {policy.reference && (
                      <div className="text-xs text-muted-foreground">
                        {policy.reference}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {productById.get(policy.produitId)?.label ?? "Produit"}
                  </TableCell>
                  <TableCell>
                    {commercialById.get(policy.commercialId)?.name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatFCFA(policy.primeNette)}
                  </TableCell>
                  <TableCell className="text-right">
                    {result ? formatFCFA(result.commissionCabinet) : "—"}
                    {result && (
                      <div className="text-xs text-muted-foreground">
                        {formatRate(result.tauxCabinet)}
                        {result.partAccessoires > 0
                          ? ` + ${formatRate(result.partAccessoires)} acc.`
                          : ""}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {result ? formatFCFA(result.commissionCommercial) : "—"}
                    {result && (
                      <div className="text-xs font-normal text-muted-foreground">
                        {formatRate(result.retrocession)}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            <TableRow className="bg-muted/30 font-semibold hover:bg-muted/30">
              <TableCell colSpan={5}>Total</TableCell>
              <TableCell className="text-right">
                {formatFCFA(totalCabinet)}
              </TableCell>
              <TableCell className="text-right">
                {formatFCFA(totalCommercial)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
