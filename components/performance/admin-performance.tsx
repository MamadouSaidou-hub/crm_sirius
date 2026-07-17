"use client";

import { useEffect, useReducer, useState } from "react";
import Link from "next/link";
import { Loader2, UsersRound } from "lucide-react";
import type { Objective, User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { fetchAllCommercials, fetchManagers } from "@/lib/data/profiles";
import {
  fetchObjectives,
  fetchRealizations,
  objectiveAmount,
  realizedSum,
  type RealizationItem,
} from "@/lib/data/performance";
import { ObjectiveProgress } from "@/components/performance/objective-progress";
import { ManagerObjectiveCard } from "@/components/performance/manager-objective-card";
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

  // Commercials grouped by their manager.
  const commercialsByManager = new Map<string, User[]>();
  for (const c of commercials) {
    if (!c.managerId) continue;
    const arr = commercialsByManager.get(c.managerId) ?? [];
    arr.push(c);
    commercialsByManager.set(c.managerId, arr);
  }

  const cabinetObjective = managers.reduce(
    (s, m) => s + objectiveAmount(objectives, m.id),
    0,
  );
  const cabinetRealized = commercials.reduce(
    (s, c) => s + realizedSum(realizations, c.id, ["validated"]),
    0,
  );
  const cabinetPending = commercials.reduce(
    (s, c) => s + realizedSum(realizations, c.id, ["pending"]),
    0,
  );

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
          Managers & cascade des objectifs
        </h3>
        {managers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-start gap-3 p-6 text-sm text-muted-foreground">
              <p>
                Aucun manager pour l&apos;instant. Créez d&apos;abord vos
                managers et leurs commerciaux, puis fixez la cible du manager et
                répartissez-la sur ses commerciaux.
              </p>
              <Link
                href="/users"
                className="inline-flex items-center gap-2 rounded-md bg-sirius-gold px-3 py-1.5 text-sm font-medium text-sirius-ink transition-opacity hover:opacity-90"
              >
                <UsersRound className="h-4 w-4" />
                Gérer l&apos;équipe
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {managers.map((m) => (
              <ManagerObjectiveCard
                key={m.id}
                manager={m}
                commercials={commercialsByManager.get(m.id) ?? []}
                objectives={objectives}
                realizations={realizations}
                onSetObjective={setObjectiveTarget}
              />
            ))}
          </div>
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
