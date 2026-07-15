"use client";

import { ShieldCheck, Zap } from "lucide-react";
import type { AskiaPricing } from "@/lib/insurers/askia";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";

interface PricingResultProps {
  insurerName: string;
  pricing: AskiaPricing;
  /** Live Askia API vs local estimate. */
  live: boolean;
}

export function PricingResult({
  insurerName,
  pricing,
  live,
}: PricingResultProps) {
  return (
    <Card className="border-sirius-gold/40">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-sirius-teal" />
            <span className="font-medium text-foreground">{insurerName}</span>
          </div>
          <Badge variant={live ? "success" : "muted"}>
            {live ? (
              <>
                <Zap className="h-3 w-3" />
                Tarif live
              </>
            ) : (
              "Estimation"
            )}
          </Badge>
        </div>

        <div className="flex items-end justify-between">
          <span className="text-sm text-muted-foreground">Prime TTC</span>
          <span className="font-heading text-3xl font-bold text-sirius-gold">
            {formatFCFA(pricing.totalPremium)}
          </span>
        </div>

        <div className="space-y-1.5 border-t border-border pt-3 text-sm">
          <Row label="Prime nette" value={pricing.netPremium} />
          <Row label="Taxes" value={pricing.taxes} />
          <Row label="Accessoires" value={pricing.fees} />
        </div>

        {!live && (
          <p className="text-xs text-muted-foreground">
            Estimation locale — configurez la clé Askia pour le tarif réel.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{formatFCFA(value)}</span>
    </div>
  );
}
