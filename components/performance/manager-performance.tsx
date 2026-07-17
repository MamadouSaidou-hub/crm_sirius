"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { Loader2, UsersRound } from "lucide-react";
import { toast } from "sonner";
import type { Objective, User } from "@/lib/types";
import { fetchAssignableCommercials } from "@/lib/data/profiles";
import {
  commissionSum,
  distributedAmount,
  fetchObjectives,
  fetchRealizations,
  objectiveAmount,
  pendingItems,
  realizedSum,
  setRealizationStatus,
  type RealizationItem,
} from "@/lib/data/performance";
import { ObjectiveProgress } from "@/components/performance/objective-progress";
import { ObjectiveReconciliation } from "@/components/performance/objective-reconciliation";
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
}

interface Data {
  commercials: User[];
  objectives: Objective[];
  realizations: RealizationItem[];
}

export function ManagerPerformance({ user, period }: ManagerPerformanceProps) {
  const [version, bump] = useReducer((x: number) => x + 1, 0);
  const [objectiveTarget, setObjectiveTarget] = useState<User | null>(null);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchAssignableCommercials(user),
      fetchObjectives(period),
      fetchRealizations(period),
    ])
      .then(([commercials, objectives, realizations]) => {
        if (active) setData({ commercials, objectives, realizations });
      })
      .catch(() => {
        if (active) setData({ commercials: [], objectives: [], realizations: [] });
      });
    return () => {
      active = false;
    };
  }, [user, period, version]);

  if (!data) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const { commercials, objectives, realizations } = data;

  const rows: PerformanceRow[] = commercials.map((c) => ({
    user: c,
    target: objectiveAmount(objectives, c.id),
    realized: realizedSum(realizations, c.id, ["validated"]),
    pending: realizedSum(realizations, c.id, ["pending"]),
    commission: commissionSum(realizations, c.id),
  }));

  const teamRealized = rows.reduce((s, r) => s + r.realized, 0);
  const teamPending = rows.reduce((s, r) => s + (r.pending ?? 0), 0);
  const teamObjective = objectiveAmount(objectives, user.id);
  const distributed = distributedAmount(
    objectives,
    commercials.map((c) => c.id),
  );
  const pending = pendingItems(
    realizations,
    commercials.map((c) => c.id),
  );

  const handleValidate = (id: string) => {
    setRealizationStatus(id, "validated", user.id).then(bump).catch(() =>
      toast.error("Action impossible."),
    );
  };
  const handleReject = (id: string) => {
    setRealizationStatus(id, "rejected", user.id).then(bump).catch(() =>
      toast.error("Action impossible."),
    );
  };

  return (
    <div className="space-y-6">
      <ObjectiveProgress
        title="Réalisé équipe ce mois"
        target={teamObjective}
        realized={teamRealized}
        pending={teamPending}
      />

      <ObjectiveReconciliation target={teamObjective} distributed={distributed} />

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
            <CardContent className="flex flex-col items-start gap-3 p-6 text-sm text-muted-foreground">
              <p>
                Aucun commercial rattaché. Créez vos commerciaux dans
                l&apos;Équipe pour leur fixer un objectif via le bouton
                «&nbsp;Objectif&nbsp;».
              </p>
              <Link
                href="/users"
                className="inline-flex items-center gap-2 rounded-md bg-sirius-gold px-3 py-1.5 text-sm font-medium text-sirius-ink transition-opacity hover:opacity-90"
              >
                <UsersRound className="h-4 w-4" />
                Créer un commercial
              </Link>
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
        onSaved={bump}
      />
    </div>
  );
}
