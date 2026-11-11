"use client";

import { useEffect, useMemo, useReducer, useState } from "react";
import { Loader2 } from "lucide-react";
import { useMockUser } from "@/lib/mock-auth";
import type { Insurer } from "@/lib/types";
import { PRODUCT_LABELS } from "@/lib/constants";
import { fetchInsurers } from "@/lib/data/insurers";
import {
  fetchCommissionAgreements,
  fetchRemunerationPlans,
} from "@/lib/data/commissions";
import {
  entryStatuses,
  type CommissionAgreement,
  type EntryStatus,
  type RemunerationPlanEntry,
} from "@/lib/payroll/rates";
import { fullDate } from "@/lib/date";
import { cn, formatFCFA } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { Forbidden } from "@/components/shared/forbidden";
import { formatRate } from "@/components/payroll/payroll-explainer";
import {
  AgreementDialog,
  BASE_LABELS,
} from "@/components/commissions/agreement-dialog";
import { PlanDialog } from "@/components/commissions/plan-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const STATUS_LABELS: Record<EntryStatus, string> = {
  current: "En vigueur",
  future: "À venir",
  past: "Remplacée",
};

const STATUS_CLASSES: Record<EntryStatus, string> = {
  current: "bg-sirius-success/15 text-sirius-success",
  future: "bg-sirius-teal/15 text-sirius-teal",
  past: "bg-secondary text-muted-foreground",
};

function StatusBadge({ status }: { status: EntryStatus }) {
  return (
    <Badge variant="outline" className={cn("border-0", STATUS_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export default function CommissionsPage() {
  const { user } = useMockUser();
  const allowed = user.role === "admin";
  const [version, refresh] = useReducer((x: number) => x + 1, 0);
  const [insurers, setInsurers] = useState<Insurer[]>([]);
  const [agreements, setAgreements] = useState<CommissionAgreement[] | null>(null);
  const [plans, setPlans] = useState<RemunerationPlanEntry[]>([]);

  useEffect(() => {
    if (!allowed) return;
    let active = true;
    Promise.all([
      fetchInsurers(),
      fetchCommissionAgreements(),
      fetchRemunerationPlans(),
    ])
      .then(([i, a, p]) => {
        if (!active) return;
        setInsurers(i);
        setAgreements(a);
        setPlans(p);
      })
      .catch(() => {
        if (active) setAgreements([]);
      });
    return () => {
      active = false;
    };
  }, [allowed, version]);

  const insurerName = useMemo(
    () => new Map(insurers.map((i) => [i.id, i.name])),
    [insurers],
  );

  const agreementStatus = useMemo(
    () =>
      entryStatuses(
        agreements ?? [],
        (a) => `${a.insurerId}/${a.productType ?? "*"}`,
        today(),
      ),
    [agreements],
  );
  const planStatus = useMemo(
    () => entryStatuses(plans, () => "plan", today()),
    [plans],
  );

  if (!allowed) {
    return (
      <Forbidden message="La gestion des taux de commission est réservée aux administrateurs." />
    );
  }

  if (agreements === null) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  const currentPlan = plans.find((p) => planStatus.get(p.id) === "current") ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Conventions & taux"
        description="Taux de commission négociés avec les compagnies et barème de rémunération des commerciaux"
      />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Commission du cabinet par compagnie</CardTitle>
          <AgreementDialog
            insurers={insurers}
            userId={user.id}
            onCreated={refresh}
          />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Compagnie</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead className="text-right">Taux</TableHead>
                <TableHead>Calculé sur</TableHead>
                <TableHead>En vigueur dès</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {agreements.map((a) => (
                <TableRow
                  key={a.id}
                  className={cn(agreementStatus.get(a.id) === "past" && "opacity-60")}
                >
                  <TableCell className="font-medium">
                    {insurerName.get(a.insurerId) ?? a.insurerId}
                  </TableCell>
                  <TableCell>
                    {a.productType ? PRODUCT_LABELS[a.productType] : "Tous"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatRate(a.rate)}
                  </TableCell>
                  <TableCell>{BASE_LABELS[a.base]}</TableCell>
                  <TableCell>{fullDate(`${a.effectiveFrom}T12:00:00`)}</TableCell>
                  <TableCell>
                    <StatusBadge status={agreementStatus.get(a.id) ?? "past"} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {a.note ?? "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Barème de rémunération des commerciaux</CardTitle>
          <PlanDialog
            key={currentPlan?.id ?? "none"}
            current={currentPlan}
            userId={user.id}
            onCreated={refresh}
          />
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">Base fixe</TableHead>
                <TableHead className="text-right">Prime perf.</TableHead>
                <TableHead className="text-right">Rétrocession</TableHead>
                <TableHead className="text-right">Durée</TableHead>
                <TableHead>En vigueur dès</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.map((p) => (
                <TableRow
                  key={p.id}
                  className={cn(planStatus.get(p.id) === "past" && "opacity-60")}
                >
                  <TableCell className="text-right">{formatFCFA(p.baseFixe)}</TableCell>
                  <TableCell className="text-right">{formatRate(p.tauxPerformance)}</TableCell>
                  <TableCell className="text-right">{formatRate(p.tauxRetrocession)}</TableCell>
                  <TableCell className="text-right">{p.dureeMois} mois</TableCell>
                  <TableCell>{fullDate(`${p.effectiveFrom}T12:00:00`)}</TableCell>
                  <TableCell>
                    <StatusBadge status={planStatus.get(p.id) ?? "past"} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Les taux ne se modifient jamais : on en ajoute un nouveau avec sa date
        d&apos;effet. Les mois déjà calculés gardent le taux qui s&apos;appliquait
        alors, et l&apos;historique reste consultable ci-dessus.
      </p>
    </div>
  );
}
