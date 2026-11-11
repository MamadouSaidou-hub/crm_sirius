import { Info } from "lucide-react";
import type { RemunerationPlan } from "@/lib/payroll/rates";
import { OBJECTIF_MENSUEL_COMMERCIAL } from "@/lib/payroll/config";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";

/** Formats a 0..1 rate as a French percentage, e.g. 0.003 -> "0,3 %". */
export function formatRate(rate: number): string {
  return `${(rate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

interface PayrollExplainerProps {
  /** Plan in force for the displayed period. */
  plan: RemunerationPlan;
  /** Distinct cabinet commission rates (0..1) applying to the displayed contracts. */
  cabinetRates: number[];
}

/** "3 %", or "3 % à 12 %" when several agreements apply. */
function describeRates(rates: number[]): string {
  if (rates.length === 0) return "le taux de la convention";
  const min = Math.min(...rates);
  const max = Math.max(...rates);
  return min === max
    ? formatRate(min)
    : `${formatRate(min)} à ${formatRate(max)}`;
}

/** Collapsible card explaining how a commercial's monthly pay is computed. */
export function PayrollExplainer({ plan, cabinetRates }: PayrollExplainerProps) {
  const duree = plan.dureeMois;
  return (
    <Card>
      <CardContent className="p-0">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 p-4 text-sm font-medium">
            <Info className="h-4 w-4 text-sirius-teal" />
            Comment est calculée la rémunération ?
            <span className="ml-auto text-xs text-muted-foreground group-open:hidden">
              Afficher
            </span>
          </summary>

          <div className="space-y-4 border-t border-border p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">
              Rémunération du mois = base fixe + prime de performance +
              commissions d&apos;acquisition
            </p>

            <ul className="list-disc space-y-2 pl-5">
              <li>
                <span className="text-foreground">Base fixe :</span>{" "}
                {formatFCFA(plan.baseFixe)}, garantie chaque mois, même sans
                production.
              </li>
              <li>
                <span className="text-foreground">Prime de performance :</span>{" "}
                {formatRate(plan.tauxPerformance)} de la production du mois
                (somme des versements des contrats encore dans le périmètre).
              </li>
              <li>
                <span className="text-foreground">
                  Commission d&apos;acquisition :
                </span>{" "}
                le cabinet touche {describeRates(cabinetRates)} de commission de
                la compagnie (selon la convention) et en reverse{" "}
                {formatRate(plan.tauxRetrocession)} au commercial.
              </li>
            </ul>

            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="mb-1 font-medium text-foreground">
                Règle des {duree} mois
              </p>
              <p>
                Un contrat ne rémunère son commercial que pendant ses {duree}{" "}
                premiers mois : le mois de signature (souscription + 1ʳᵉ
                cotisation) est le mois 1, puis les {duree - 1} mois suivants. À
                partir du mois {duree + 1}, tout revient au cabinet, quelle que
                soit la durée du contrat (10 ans ou plus).
              </p>
            </div>

            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="mb-1 font-medium text-foreground">
                Assiette de la commission
              </p>
              <p>
                <span className="text-foreground">Produit variable</span>{" "}
                (Libre retraite, Retraite prestige) : le montant réellement
                versé dans le mois.{" "}
                <span className="text-foreground">Produit figé</span>{" "}
                (Retraite simple, Prévoyance décès) : fixée à la signature
                (souscription + cotisation de référence le mois 1, puis la
                cotisation de référence seule), même si le versement réel
                diffère.
              </p>
            </div>

            <p>
              Objectif mensuel : {formatFCFA(OBJECTIF_MENSUEL_COMMERCIAL)} de
              production par commercial. Les taux sont fixés par l&apos;admin
              (page Conventions &amp; taux) et s&apos;appliquent à partir de leur
              date d&apos;effet.
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
