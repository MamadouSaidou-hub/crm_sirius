"use client";

import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface ObjectiveReconciliationProps {
  /** Top-down target set on the manager. */
  target: number;
  /** Sum of the objectives distributed to the manager's commercials. */
  distributed: number;
  className?: string;
}

/**
 * Reconciles a manager's target against the sum distributed to their team.
 * Signals whether the distribution covers the target, leaves a gap, or exceeds
 * it — so an admin/manager sees the cascade at a glance.
 */
export function ObjectiveReconciliation({
  target,
  distributed,
  className,
}: ObjectiveReconciliationProps) {
  const gap = target - distributed;
  const noTarget = target <= 0;
  const covered = !noTarget && gap <= 0;

  const status = noTarget
    ? {
        icon: Info,
        text: "Aucune cible fixée pour le manager",
        tone: "text-muted-foreground",
        bg: "bg-secondary/40",
      }
    : covered
      ? {
          icon: CheckCircle2,
          text:
            gap < 0
              ? `Cible couverte — ${formatFCFA(-gap)} au-delà`
              : "Cible entièrement répartie",
          tone: "text-sirius-success",
          bg: "bg-sirius-success/10",
        }
      : {
          icon: AlertTriangle,
          text: `${formatFCFA(gap)} non répartis aux commerciaux`,
          tone: "text-sirius-warning",
          bg: "bg-sirius-warning/10",
        };

  const StatusIcon = status.icon;

  return (
    <Card className={className}>
      <CardContent className="space-y-3 p-4">
        <div className="grid grid-cols-3 gap-2 text-sm">
          <Metric label="Cible manager" value={formatFCFA(target)} />
          <Metric label="Réparti équipe" value={formatFCFA(distributed)} />
          <Metric
            label="Écart"
            value={formatFCFA(Math.abs(gap))}
            tone={covered ? "text-sirius-success" : "text-sirius-warning"}
          />
        </div>
        <div
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium",
            status.bg,
            status.tone,
          )}
        >
          <StatusIcon className="h-4 w-4 shrink-0" />
          <span>{status.text}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: string;
}) {
  return (
    <div className="rounded-md bg-secondary/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn("truncate font-semibold text-foreground", tone)}>
        {value}
      </p>
    </div>
  );
}
