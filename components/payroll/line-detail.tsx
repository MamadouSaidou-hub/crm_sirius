import { FileText } from "lucide-react";
import type {
  PayrollContract,
  PayrollLine,
  PayrollPolicy,
  PayrollProduct,
} from "@/lib/data/payroll";
import type { RemunerationPlan } from "@/lib/payroll/rates";
import { formatRate } from "@/components/payroll/payroll-explainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatNumber } from "@/lib/utils";

const TH = "px-2 py-1 text-xs font-medium text-muted-foreground";
const TD = "px-2 py-1.5";

interface LineDetailProps {
  line: PayrollLine;
  /** Plan in force for the displayed period. */
  plan: RemunerationPlan;
  contractById: Map<string, PayrollContract>;
  policyById: Map<string, PayrollPolicy>;
  productById: Map<string, PayrollProduct>;
  onPayslip: () => void;
}

/** Breakdown of one commercial's month: life contracts, then IARD policies. */
export function LineDetail({
  line,
  plan,
  contractById,
  policyById,
  productById,
  onPayslip,
}: LineDetailProps) {
  return (
    <div>
      <div className="mb-3 flex justify-end">
        <Button size="sm" variant="outline" onClick={onPayslip}>
          <FileText className="h-4 w-4" />
          Bulletin de paie
        </Button>
      </div>

      {line.contrats.length === 0 && line.polices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucun contrat ni police ce mois — seule la base fixe est garantie.
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
                      <tr key={detail.contratId} className="border-t border-border/50">
                        <td className={cn(TD, "font-medium")}>
                          {contractById.get(detail.contratId)?.clientName ?? "Contrat"}
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
                          <td colSpan={4} className={cn(TD, "text-muted-foreground")}>
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
                        <tr key={police.policyId} className="border-t border-border/50">
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
    </div>
  );
}
