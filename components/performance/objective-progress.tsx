"use client";

import { attainment } from "@/lib/store/performance";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ObjectiveProgressProps {
  title: string;
  target: number;
  realized: number;
  /** Declared but not yet validated — shown as a hint, not counted. */
  pending?: number;
}

/** Objectif / Réalisé / Reste / Taux d'atteinte progress card. */
export function ObjectiveProgress({
  title,
  target,
  realized,
  pending = 0,
}: ObjectiveProgressProps) {
  const pct = attainment(realized, target);
  const remaining = Math.max(0, target - realized);
  const reached = pct >= 100;

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="font-heading text-3xl font-bold text-foreground">
              {formatFCFA(realized)}
            </p>
          </div>
          <span
            className={cn(
              "rounded-md px-2 py-1 text-sm font-semibold",
              reached
                ? "bg-sirius-success/15 text-sirius-success"
                : "bg-sirius-gold/15 text-sirius-gold",
            )}
          >
            {pct}%
          </span>
        </div>

        <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className={cn(
              "h-full rounded-full transition-all",
              reached ? "bg-sirius-success" : "bg-sirius-gold",
            )}
            style={{ width: `${Math.min(100, pct)}%` }}
          />
        </div>

        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metric label="Objectif" value={formatFCFA(target)} />
          <Metric label="Reste" value={formatFCFA(remaining)} />
          <Metric
            label="En attente"
            value={formatFCFA(pending)}
            muted={pending === 0}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="rounded-md bg-secondary/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={cn(
          "truncate font-semibold",
          muted ? "text-muted-foreground" : "text-foreground",
        )}
      >
        {value}
      </p>
    </div>
  );
}
