"use client";

import { Check, X } from "lucide-react";
import type { Realization } from "@/lib/types";
import {
  PRODUCT_LABELS,
  REALIZATION_STATUS_BADGE_VARIANT,
  REALIZATION_STATUS_LABELS,
} from "@/lib/constants";
import { getUserById } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { relativeDate } from "@/lib/date";

interface RealizationsListProps {
  realizations: Realization[];
  /** Show which commercial declared each item (manager/admin views). */
  showCommercial?: boolean;
  /** When provided, pending items get validate/reject actions. */
  onValidate?: (id: string) => void;
  onReject?: (id: string) => void;
}

export function RealizationsList({
  realizations,
  showCommercial,
  onValidate,
  onReject,
}: RealizationsListProps) {
  return (
    <div className="space-y-2">
      {realizations.map((r) => {
        const commercial = showCommercial
          ? getUserById(r.commercialId)
          : undefined;
        const canAct = r.status === "pending" && (onValidate || onReject);
        return (
          <Card key={r.id}>
            <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {formatFCFA(r.amount)}
                  </span>
                  <Badge variant={REALIZATION_STATUS_BADGE_VARIANT[r.status]}>
                    {REALIZATION_STATUS_LABELS[r.status]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {commercial ? `${commercial.name} · ` : ""}
                  {PRODUCT_LABELS[r.product]} · {r.source.toUpperCase()}
                  {r.reference ? ` · ${r.reference}` : ""} ·{" "}
                  {relativeDate(r.createdAt)}
                </p>
              </div>
              {canAct && (
                <div className="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onReject?.(r.id)}
                  >
                    <X className="h-4 w-4" />
                    Rejeter
                  </Button>
                  <Button size="sm" onClick={() => onValidate?.(r.id)}>
                    <Check className="h-4 w-4" />
                    Valider
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
