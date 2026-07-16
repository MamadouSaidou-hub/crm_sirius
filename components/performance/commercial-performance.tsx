"use client";

import { useEffect, useReducer, useState } from "react";
import { BadgeDollarSign, Loader2, Target } from "lucide-react";
import type { User } from "@/lib/types";
import {
  commissionSum,
  fetchObjective,
  fetchRealizations,
  realizedSum,
  type RealizationItem,
} from "@/lib/data/performance";
import { ObjectiveProgress } from "@/components/performance/objective-progress";
import { PartnerPortalsCard } from "@/components/performance/partner-portals-card";
import { DeclareRealizationDialog } from "@/components/performance/declare-realization-dialog";
import { RealizationsList } from "@/components/performance/realizations-list";
import { EmptyState } from "@/components/shared/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";

interface CommercialPerformanceProps {
  user: User;
  period: string;
}

export function CommercialPerformance({
  user,
  period,
}: CommercialPerformanceProps) {
  const [version, bump] = useReducer((x: number) => x + 1, 0);
  const [target, setTarget] = useState(0);
  const [realizations, setRealizations] = useState<RealizationItem[] | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    Promise.all([fetchObjective(user.id, period), fetchRealizations(period)])
      .then(([objective, reals]) => {
        if (!active) return;
        setTarget(objective?.targetAmount ?? 0);
        setRealizations(reals.filter((r) => r.commercialId === user.id));
      })
      .catch(() => active && setRealizations([]));
    return () => {
      active = false;
    };
  }, [user.id, period, version]);

  if (realizations === null) {
    return (
      <div className="flex items-center justify-center py-16 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const validated = realizedSum(realizations, user.id, ["validated"]);
  const pending = realizedSum(realizations, user.id, ["pending"]);
  const commission = commissionSum(realizations, user.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Mon objectif
        </h2>
        <DeclareRealizationDialog
          commercialId={user.id}
          period={period}
          onDeclared={bump}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ObjectiveProgress
            title="Réalisé"
            target={target}
            realized={validated}
            pending={pending}
          />
        </div>
        <Card>
          <CardContent className="flex h-full flex-col justify-center gap-2 p-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sirius-gold/15 text-sirius-gold">
              <BadgeDollarSign className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">Commission estimée</p>
            <p className="font-heading text-2xl font-bold text-foreground">
              {formatFCFA(commission)}
            </p>
            <p className="text-xs text-muted-foreground">
              Sur réalisé validé, au taux apporteur de la compagnie.
            </p>
          </CardContent>
        </Card>
      </div>

      <PartnerPortalsCard />

      <div className="space-y-3">
        <h3 className="font-heading text-base font-semibold text-foreground">
          Mes déclarations
        </h3>
        {realizations.length === 0 ? (
          <EmptyState
            icon={Target}
            title="Aucune déclaration"
            description="Déclarez vos souscriptions réalisées pour qu'elles soient validées."
          />
        ) : (
          <RealizationsList realizations={realizations} />
        )}
      </div>
    </div>
  );
}
