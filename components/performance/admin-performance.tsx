"use client";

import { useEffect, useReducer, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Objective, User } from "@/lib/types";
import { fetchAllCommercials, fetchManagers } from "@/lib/data/profiles";
import {
  commissionSum,
  fetchObjectives,
  fetchRealizations,
  objectiveAmount,
  realizedSum,
  type RealizationItem,
} from "@/lib/data/performance";
import { ObjectiveProgress } from "@/components/performance/objective-progress";
import {
  TeamPerformanceTable,
  type PerformanceRow,
} from "@/components/performance/team-performance-table";
import { SetObjectiveDialog } from "@/components/performance/set-objective-dialog";

interface AdminPerformanceProps {
  user: User;
  period: string;
}

interface Data {
  managers: User[];
  commercials: User[];
  objectives: Objective[];
  realizations: RealizationItem[];
}

export function AdminPerformance({ user, period }: AdminPerformanceProps) {
  const [version, bump] = useReducer((x: number) => x + 1, 0);
  const [objectiveTarget, setObjectiveTarget] = useState<User | null>(null);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchManagers(),
      fetchAllCommercials(),
      fetchObjectives(period),
      fetchRealizations(period),
    ])
      .then(([managers, commercials, objectives, realizations]) => {
        if (active)
          setData({ managers, commercials, objectives, realizations });
      })
      .catch(() => {
        if (active)
          setData({
            managers: [],
            commercials: [],
            objectives: [],
            realizations: [],
          });
      });
    return () => {
      active = false;
    };
  }, [period, version]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const { managers, commercials, objectives, realizations } = data;

  // Commercial ids grouped by their manager.
  const teamByManager = new Map<string, string[]>();
  for (const c of commercials) {
    if (!c.managerId) continue;
    const arr = teamByManager.get(c.managerId) ?? [];
    arr.push(c.id);
    teamByManager.set(c.managerId, arr);
  }

  const rows: PerformanceRow[] = managers.map((m) => {
    const ids = teamByManager.get(m.id) ?? [];
    const realized = ids.reduce(
      (s, cid) => s + realizedSum(realizations, cid, ["validated"]),
      0,
    );
    const pending = ids.reduce(
      (s, cid) => s + realizedSum(realizations, cid, ["pending"]),
      0,
    );
    const commission = ids.reduce(
      (s, cid) => s + commissionSum(realizations, cid),
      0,
    );
    return {
      user: m,
      target: objectiveAmount(objectives, m.id),
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
        onSaved={bump}
      />
    </div>
  );
}
