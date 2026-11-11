import { Info } from "lucide-react";
import {
  BASE_FIXE,
  DUREE_REMUNERATION_MOIS,
  OBJECTIF_MENSUEL_COMMERCIAL,
  TAUX_CABINET,
  TAUX_COMMISSION_ACQUISITION,
  TAUX_PERFORMANCE,
  TAUX_RETROCESSION,
} from "@/lib/payroll/config";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";

/** Formats a 0..1 rate as a French percentage, e.g. 0.003 -> "0,3 %". */
export function formatRate(rate: number): string {
  return `${(rate * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}

/** Collapsible card explaining how a commercial's monthly pay is computed. */
export function PayrollExplainer() {
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
                {formatFCFA(BASE_FIXE)}, garantie chaque mois, même sans
                production.
              </li>
              <li>
                <span className="text-foreground">Prime de performance :</span>{" "}
                {formatRate(TAUX_PERFORMANCE)} de la production du mois (somme
                des versements des contrats encore dans le périmètre).
              </li>
              <li>
                <span className="text-foreground">
                  Commission d&apos;acquisition :
                </span>{" "}
                le cabinet touche {formatRate(TAUX_CABINET)} de commission de la
                compagnie et en reverse {formatRate(TAUX_RETROCESSION)} au
                commercial, soit {formatRate(TAUX_COMMISSION_ACQUISITION)} de
                l&apos;assiette du contrat.
              </li>
            </ul>

            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="mb-1 font-medium text-foreground">
                Règle des {DUREE_REMUNERATION_MOIS} mois
              </p>
              <p>
                Un contrat ne rémunère son commercial que pendant ses{" "}
                {DUREE_REMUNERATION_MOIS} premiers mois : le mois de signature
                (souscription + 1ʳᵉ cotisation) est le mois 1, puis les 2 mois
                suivants. À partir du mois {DUREE_REMUNERATION_MOIS + 1}, tout
                revient au cabinet, quelle que soit la durée du contrat (10
                ans ou plus).
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
              production par commercial.
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
