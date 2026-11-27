"use client";

import { useCallback, useEffect, useState } from "react";
import { Banknote, Download, Landmark, Lock, Scale, Target, TriangleAlert, Users } from "lucide-react";
import { toast } from "sonner";
import { buildPayrollCsv } from "@/lib/payroll/export";
import { downloadTextFile } from "@/lib/download";
import { useMockUser } from "@/lib/mock-auth";
import type { User } from "@/lib/types";
import { isAdminLevel } from "@/lib/permissions";
import {
  fetchClosedPeriods,
  fetchClosing,
  type PayrollClosing,
} from "@/lib/data/closings";
import { driftOf, isClosable, monthName } from "@/lib/payroll/closing";
import { MissingAgreementError, MissingPlanError } from "@/lib/payroll/rates";
import { CURRENT_PERIOD } from "@/lib/data/performance";
import { fetchPayrollSnapshot, type PayrollSnapshot } from "@/lib/data/payroll";
import { OBJECTIF_MENSUEL_COMMERCIAL } from "@/lib/payroll/config";
import { formatFCFA, formatFCFACompact } from "@/lib/utils";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/dashboard/stat-card";
import { PeriodSelector } from "@/components/performance/period-selector";
import { ObjectiveProgress } from "@/components/performance/objective-progress";
import { PayrollTable } from "@/components/payroll/payroll-table";
import { PayrollExplainer } from "@/components/payroll/payroll-explainer";
import { NewMenu } from "@/components/payroll/new-menu";
import { ClosingControls } from "@/components/payroll/closing-controls";
import { PoliciesTable } from "@/components/payroll/policies-table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/** Missing agreement/plan errors are actionable for the admin: show them as-is. */
function describeLoadError(error: unknown): string {
  if (error instanceof MissingAgreementError || error instanceof MissingPlanError) {
    return `${error.message} Un administrateur doit l'ajouter dans « Conventions & taux ».`;
  }
  return "Impossible de charger la paie.";
}

interface ClosingState {
  closed: boolean;
  /** Frozen totals; only visible to those who see the whole payroll. */
  detail: PayrollClosing | null;
}

/** The month's payroll and its closing status, loaded together. */
async function loadMonth(user: User, period: string) {
  const [snapshot, closedPeriods, detail] = await Promise.all([
    fetchPayrollSnapshot(user, period),
    // Degrade gracefully while the closing migration is not applied.
    fetchClosedPeriods().catch(() => [] as string[]),
    fetchClosing(period).catch(() => null),
  ]);
  const closing: ClosingState = {
    closed: closedPeriods.includes(period),
    detail,
  };
  return { snapshot, closing };
}

export default function PayrollPage() {
  const { user } = useMockUser();
  const [period, setPeriod] = useState(CURRENT_PERIOD);
  const [snapshot, setSnapshot] = useState<PayrollSnapshot | null>(null);
  const [closing, setClosing] = useState<ClosingState>({ closed: false, detail: null });
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canWrite = user.role !== "commercial";

  const load = useCallback(async () => {
    try {
      const data = await loadMonth(user, period);
      setSnapshot(data.snapshot);
      setClosing(data.closing);
      setLoadError(null);
    } catch (error) {
      setLoadError(describeLoadError(error));
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    let active = true;
    loadMonth(user, period)
      .then((data) => {
        if (!active) return;
        setSnapshot(data.snapshot);
        setClosing(data.closing);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(describeLoadError(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user, period]);

  const lines = snapshot?.lines ?? [];
  const monthPolicies = (snapshot?.policies ?? []).filter(
    (p) => p.dateEffet.slice(0, 7) === period,
  );
  const monthEvaluated = lines.flatMap((l) => l.polices);

  /** Downloads the month's payroll as a file Excel opens directly. */
  const exportMonth = () => {
    if (!snapshot) return;
    const contractName = new Map(snapshot.contracts.map((c) => [c.id, c.clientName]));
    const policyName = new Map(snapshot.policies.map((p) => [p.id, p.clientName]));
    const csv = buildPayrollCsv({
      period,
      lines: snapshot.lines.map((l) => ({ ...l, commercialName: l.commercial.name })),
      contractName: (id) => contractName.get(id) ?? "Contrat",
      policyName: (id) => policyName.get(id) ?? "Police",
    });
    downloadTextFile(`paie-${period}.csv`, csv);
    toast.success(`Export de ${period} téléchargé`);
  };
  const totalPay = lines.reduce((s, l) => s + l.total, 0);
  const totalProduction = lines.reduce((s, l) => s + l.production, 0);
  const belowTarget = lines.filter(
    (l) => l.production < OBJECTIF_MENSUEL_COMMERCIAL,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paie des commerciaux"
        description={
          user.role === "commercial" || !snapshot
            ? `Objectif mensuel : ${formatFCFA(OBJECTIF_MENSUEL_COMMERCIAL)}`
            : `Objectif mensuel : ${formatFCFA(OBJECTIF_MENSUEL_COMMERCIAL)} par commercial · ${lines.length} commercial${lines.length > 1 ? "ux" : ""}`
        }
        actions={
          <>
            <PeriodSelector value={period} onChange={setPeriod} />
            {closing.closed && (
              <Badge variant="success" className="gap-1">
                <Lock className="h-3 w-3" />
                Clôturé
              </Badge>
            )}
            {canWrite && snapshot && lines.length > 0 && (
              <ClosingControls
                period={period}
                closed={closing.closed}
                closable={isClosable(period, new Date())}
                canClose={isAdminLevel(user.role)}
                canReopen={user.role === "super_admin"}
                closerName={user.name}
                lines={lines}
                totalCabinetCommission={snapshot.profitability.commissionCabinet}
                onChanged={load}
              />
            )}
            {canWrite && snapshot && lines.length > 0 && (
              <Button size="sm" variant="outline" onClick={exportMonth}>
                <Download className="h-4 w-4" />
                Exporter Excel
              </Button>
            )}
            {canWrite && snapshot && (
              <NewMenu
                snapshot={snapshot}
                commercials={lines.map((l) => l.commercial)}
                period={period}
                periodClosed={closing.closed}
                userId={user.id}
                onCreated={load}
              />
            )}
          </>
        }
      />

      {snapshot && (
        <PayrollExplainer
          plan={snapshot.plan}
          cabinetRates={[...new Set(Object.values(snapshot.cabinetRates))]}
        />
      )}

      {closing.closed && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-sirius-success/30 bg-sirius-success/10 p-3 text-sm">
          <Lock className="h-4 w-4 shrink-0 text-sirius-success" />
          <span>
            <strong className="capitalize">{monthName(period)}</strong> est
            clôturé
            {closing.detail
              ? ` le ${new Date(closing.detail.closedAt).toLocaleDateString("fr-FR")} par ${closing.detail.closedByName ?? "—"}`
              : ""}{" "}
            : les montants sont figés.
            {closing.detail?.note ? ` — ${closing.detail.note}` : ""}
          </span>
        </div>
      )}

      {closing.detail && driftOf(closing.detail.totalPay, totalPay) !== 0 && (
        <div className="flex items-start gap-2 rounded-md border border-sirius-danger/40 bg-sirius-danger/10 p-3 text-sm text-sirius-danger">
          <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Les montants calculés ({formatFCFA(totalPay)}) ne correspondent plus
            aux montants figés à la clôture ({formatFCFA(closing.detail.totalPay)}).
            Contactez le super administrateur avant tout paiement.
          </span>
        </div>
      )}

      {loadError && (
        <p className="rounded-md border border-sirius-danger/40 bg-sirius-danger/10 p-3 text-sm text-sirius-danger">
          {loadError}
        </p>
      )}

      {!snapshot ? (
        loading ? <Skeleton className="h-64 w-full" /> : null
      ) : lines.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Aucun commercial"
          description="Aucun commercial dans votre périmètre."
        />
      ) : user.role === "commercial" ? (
        <>
          <ObjectiveProgress
            title="Ma production du mois"
            target={OBJECTIF_MENSUEL_COMMERCIAL}
            realized={lines[0].production}
          />
          <PayrollTable
            lines={lines}
            contracts={snapshot.contracts}
            policies={snapshot.policies}
            products={snapshot.products}
            period={period}
            plan={snapshot.plan}
          />
          {monthPolicies.length > 0 && (
            <PoliciesTable
              policies={monthPolicies}
              evaluated={monthEvaluated}
              products={snapshot.products}
              commercials={lines.map((l) => l.commercial)}
            />
          )}
        </>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Rémunération totale"
              value={formatFCFACompact(totalPay)}
              icon={Banknote}
              tone="gold"
            />
            <StatCard
              label="Production"
              value={formatFCFACompact(totalProduction)}
              icon={Target}
              tone="teal"
              hint={
                belowTarget === 0
                  ? `Objectif atteint par les ${lines.length} commerciaux`
                  : `${belowTarget} commercial${belowTarget > 1 ? "ux" : ""} sous l'objectif de ${formatFCFACompact(OBJECTIF_MENSUEL_COMMERCIAL)}`
              }
            />
            <StatCard
              label="Commission du cabinet"
              value={formatFCFACompact(snapshot.profitability.commissionCabinet)}
              icon={Landmark}
              tone="teal"
              hint="Ce que rapportent les compagnies"
            />
            <StatCard
              label="Solde du cabinet"
              value={formatFCFACompact(snapshot.profitability.net)}
              icon={Scale}
              tone={snapshot.profitability.net >= 0 ? "success" : "danger"}
              hint={
                snapshot.profitability.net >= 0
                  ? "Commission moins paie : gain"
                  : "Commission moins paie : perte"
              }
            />
          </div>
          <PayrollTable
            lines={lines}
            contracts={snapshot.contracts}
            policies={snapshot.policies}
            products={snapshot.products}
            period={period}
            plan={snapshot.plan}
          />
          {monthPolicies.length > 0 && (
            <PoliciesTable
              policies={monthPolicies}
              evaluated={monthEvaluated}
              products={snapshot.products}
              commercials={lines.map((l) => l.commercial)}
            />
          )}
        </>
      )}
    </div>
  );
}
