"use client";

import { Check, Minus, Zap } from "lucide-react";
import type { QuoteOption } from "@/lib/types";
import {
  AUTO_FORMULA_LABELS,
  INTEGRATION_MODE_BADGE_VARIANT,
  INTEGRATION_MODE_LABELS,
} from "@/lib/constants";
import { getInsurerById } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn, formatFCFA } from "@/lib/utils";

interface QuoteOptionCardProps {
  option: QuoteOption;
  /** Highlights the cheapest offer. */
  best?: boolean;
  onSubscribe: (option: QuoteOption) => void;
}

export function QuoteOptionCard({
  option,
  best,
  onSubscribe,
}: QuoteOptionCardProps) {
  const insurer = getInsurerById(option.insurerId);

  return (
    <Card
      className={cn(
        "relative overflow-hidden",
        best && "border-sirius-gold/60 ring-1 ring-sirius-gold/30",
      )}
    >
      {best && (
        <span className="absolute right-0 top-0 rounded-bl-md bg-sirius-gold px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#0A0D14]">
          Meilleur prix
        </span>
      )}
      <CardContent className="space-y-4 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="font-heading text-base font-semibold text-foreground">
              {insurer?.name ?? "Assureur"}
            </p>
            <p className="text-xs text-muted-foreground">
              {AUTO_FORMULA_LABELS[option.formula]}
            </p>
          </div>
          <Badge variant={INTEGRATION_MODE_BADGE_VARIANT[option.integrationMode]}>
            {option.integrationMode === "api" && <Zap className="h-3 w-3" />}
            {INTEGRATION_MODE_LABELS[option.integrationMode]}
          </Badge>
        </div>

        <div>
          <p className="font-heading text-2xl font-bold text-sirius-gold">
            {formatFCFA(option.totalPremium)}
          </p>
          <p className="text-xs text-muted-foreground">
            Prime nette {formatFCFA(option.netPremium)} · Taxes{" "}
            {formatFCFA(option.taxes)} · Accessoires {formatFCFA(option.fees)}
          </p>
        </div>

        <ul className="space-y-1">
          {option.guarantees.map((g) => (
            <li
              key={g.label}
              className={cn(
                "flex items-center gap-2 text-xs",
                g.included ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {g.included ? (
                <Check className="h-3.5 w-3.5 text-sirius-success" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              {g.label}
            </li>
          ))}
        </ul>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-muted-foreground">
            Valable {option.validityDays} jours
          </span>
          <Button size="sm" onClick={() => onSubscribe(option)}>
            Souscrire
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
