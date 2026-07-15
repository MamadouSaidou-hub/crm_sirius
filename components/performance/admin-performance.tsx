"use client";

import { useState } from "react";
import type { User } from "@/lib/types";
import { users } from "@/lib/mock-data";
import {
  commissionTotal,
  getObjective,
  realizedTotal,
} from "@/lib/store/performance";
import { ObjectiveProgress } from "@/components/performance/objective-progress";
import {
  TeamPerformanceTable,
  type PerformanceRow,
} from "@/components/performance/team-performance-table";
import { SetObjectiveDialog } from "@/components/performance/set-objective-dialog";

interface AdminPerformanceProps {
  user: User;
  period: string;
  refresh: () => void;
}

/** Realized/pending/commission of every commercial reporting to a manager. */
function managerTotals(
  managerId: string,
  period: string,
): { realized: number; pending: number; commission: number } {
  const team = users.filter(
    (u) => u.role === "commercial" && u.managerId === managerId,
  );
  return team.reduce(
    (acc, c) => ({
      realized: acc.realized + realizedTotal(c.id, ["validated"], period),
      pending: acc.pending + realizedTotal(c.id, ["pending"], period),
      commission: acc.commission + commissionTotal(c.id, period),
    }),
    { realized: 0, pending: 0, commission: 0 },
  );
}

export function AdminPerformance({
  user,
  period,
  refresh,
}: AdminPerformanceProps) {
  const [objectiveTarget, setObjectiveTarget] = useState<User | null>(null);

  const managers = users.filter((u) => u.role === "manager");
  const rows: PerformanceRow[] = managers.map((m) => {
    const { realized, pending, commission } = managerTotals(m.id, period);
    return {
      user: m,
      target: getObjective(m.id, period)?.targetAmount ?? 0,
      realized,
      pending,
      commission,
    };
  });

  const cabinetObjective = rows.reduce((s, r) => s + r.target, 0);
  const cabinetRealized = rows.reduce((s, r) => s + r.realized, 0);
  const cabinetPending = rows.reduce((s, r) => s + (r.pending ?? 0), 0);

  return (
    <div className="space-y-6">
      <ObjectiveProgress
        title="Objectif cabinet ce mois"
        target={cabinetObjective}
        realized={cabinetRealized}
        pending={cabinetPending}
      />

      <div className="space-y-3">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Managers
        </h3>
        <TeamPerformanceTable
          rows={rows}
          showCommission
          onSetObjective={setObjectiveTarget}
        />
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
