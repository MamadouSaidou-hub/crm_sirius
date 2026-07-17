"use client";

import { Target } from "lucide-react";
import type { Objective, User } from "@/lib/types";
import {
  commissionSum,
  distributedAmount,
  objectiveAmount,
  realizedSum,
  type RealizationItem,
} from "@/lib/data/performance";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TeamPerformanceTable,
  type PerformanceRow,
} from "@/components/performance/team-performance-table";
import { ObjectiveReconciliation } from "@/components/performance/objective-reconciliation";

interface ManagerObjectiveCardProps {
  manager: User;
  commercials: User[];
  objectives: Objective[];
  realizations: RealizationItem[];
  /** Sets an objective for any user (manager or one of their commercials). */
  onSetObjective: (user: User) => void;
}

/**
 * Admin drill-down: one manager, their target (cible) reconciled against the
 * sum distributed to their commercials, and a sub-table letting the admin set
 * each commercial's objective directly.
 */
export function ManagerObjectiveCard({
  manager,
  commercials,
  objectives,
  realizations,
  onSetObjective,
}: ManagerObjectiveCardProps) {
  const target = objectiveAmount(objectives, manager.id);
  const distributed = distributedAmount(
    objectives,
    commercials.map((c) => c.id),
  );

  const rows: PerformanceRow[] = commercials.map((c) => ({
    user: c,
    target: objectiveAmount(objectives, c.id),
    realized: realizedSum(realizations, c.id, ["validated"]),
    pending: realizedSum(realizations, c.id, ["pending"]),
    commission: commissionSum(realizations, c.id),
  }));

  return (
    <Card>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <UserAvatar name={manager.name} role={manager.role} />
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {manager.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {commercials.length} commercial
                {commercials.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSetObjective(manager)}
          >
            <Target className="h-4 w-4" />
            Cible manager
          </Button>
        </div>

        <ObjectiveReconciliation target={target} distributed={distributed} />

        {rows.length === 0 ? (
          <p className="rounded-md bg-secondary/40 px-3 py-3 text-xs text-muted-foreground">
            Aucun commercial rattaché à ce manager.
          </p>
        ) : (
          <TeamPerformanceTable
            rows={rows}
            showCommission
            onSetObjective={onSetObjective}
          />
        )}
      </CardContent>
    </Card>
  );
}
