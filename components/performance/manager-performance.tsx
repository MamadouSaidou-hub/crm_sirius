"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import { assignableCommercials } from "@/lib/access";
import {
  commissionTotal,
  getObjective,
  getPendingRealizations,
  realizedTotal,
  setRealizationStatus,
} from "@/lib/store/performance";
import { ObjectiveProgress } from "@/components/performance/objective-progress";
import {
  TeamPerformanceTable,
  type PerformanceRow,
} from "@/components/performance/team-performance-table";
import { RealizationsList } from "@/components/performance/realizations-list";
import { SetObjectiveDialog } from "@/components/performance/set-objective-dialog";
import { Card, CardContent } from "@/components/ui/card";

interface ManagerPerformanceProps {
  user: User;
  period: string;
  refresh: () => void;
}

export function ManagerPerformance({
  user,
  period,
  refresh,
}: ManagerPerformanceProps) {
  const [objectiveTarget, setObjectiveTarget] = useState<User | null>(null);

  const commercials = assignableCommercials(user);
  const rows: PerformanceRow[] = commercials.map((c) => ({
    user: c,
    target: getObjective(c.id, period)?.targetAmount ?? 0,
    realized: realizedTotal(c.id, ["validated"], period),
    pending: realizedTotal(c.id, ["pending"], period),
    commission: commissionTotal(c.id, period),
  }));

  const teamRealized = rows.reduce((s, r) => s + r.realized, 0);
  const teamPending = rows.reduce((s, r) => s + (r.pending ?? 0), 0);
  const teamObjective = getObjective(user.id, period)?.targetAmount ?? 0;

  const pending = getPendingRealizations(
    commercials.map((c) => c.id),
    period,
  );

  const handleValidate = (id: string) => {
    setRealizationStatus(id, "validated", user.id);
    refresh();
  };
  const handleReject = (id: string) => {
    setRealizationStatus(id, "rejected", user.id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <ObjectiveProgress
        title="Objectif équipe ce mois"
        target={teamObjective}
        realized={teamRealized}
        pending={teamPending}
      />

      {pending.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-heading text-base font-semibold text-foreground">
            À valider
            <span className="ml-2 text-sm font-normal text-sirius-gold">
              {pending.length}
            </span>
          </h3>
          <RealizationsList
            realizations={pending}
            showCommercial
            onValidate={handleValidate}
            onReject={handleReject}
          />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Mon équipe
        </h3>
        {rows.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              Aucun commercial rattaché.
            </CardContent>
          </Card>
        ) : (
          <TeamPerformanceTable
            rows={rows}
            showCommission
            onSetObjective={setObjectiveTarget}
          />
        )}
      </div>

      <SetObjectiveDialog
        target={objectiveTarget}
        period={period}
        setBy={user.id}
        onOpenChange={(o) => {
          if (!o) setObjectiveTarget(null);
        }}
        onSaved={refresh}
      />
    </div>
  );
}
