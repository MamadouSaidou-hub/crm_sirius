"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Banknote, Target, Users } from "lucide-react";
import { useMockUser } from "@/lib/mock-auth";
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
import { ContractDialog } from "@/components/payroll/contract-dialog";
import { PaymentDialog } from "@/components/payroll/payment-dialog";
import { Skeleton } from "@/components/ui/skeleton";

/** Missing agreement/plan errors are actionable for the admin: show them as-is. */
function describeLoadError(error: unknown): string {
  if (error instanceof MissingAgreementError || error instanceof MissingPlanError) {
    return `${error.message} Un administrateur doit l'ajouter dans « Conventions & taux ».`;
  }
  return "Impossible de charger la paie.";
}

export default function PayrollPage() {
  const { user } = useMockUser();
  const [period, setPeriod] = useState(CURRENT_PERIOD);
  const [snapshot, setSnapshot] = useState<PayrollSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canWrite = user.role !== "commercial";

  const load = useCallback(async () => {
    try {
      setSnapshot(await fetchPayrollSnapshot(user, period));
      setLoadError(null);
    } catch (error) {
      setLoadError(describeLoadError(error));
    } finally {
      setLoading(false);
    }
  }, [user, period]);

  useEffect(() => {
    let active = true;
    fetchPayrollSnapshot(user, period)
      .then((data) => {
        if (!active) return;
        setSnapshot(data);
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
  const totalPay = lines.reduce((s, l) => s + l.total, 0);
  const totalProduction = lines.reduce((s, l) => s + l.production, 0);
  const belowTarget = lines.filter(
    (l) => l.production < OBJECTIF_MENSUEL_COMMERCIAL,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Paie des commerciaux"
        description={`Objectif mensuel : ${formatFCFA(OBJECTIF_MENSUEL_COMMERCIAL)} par commercial`}
        actions={
          <>
            <PeriodSelector value={period} onChange={setPeriod} />
            {canWrite && snapshot && (
              <>
                <PaymentDialog
                  contracts={snapshot.contracts}
                  period={period}
                  userId={user.id}
                  onCreated={load}
                />
                <ContractDialog
                  commercials={lines.map((l) => l.commercial)}
                  products={snapshot.products}
                  onCreated={load}
                />
              </>
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
            plan={snapshot.plan}
          />
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
            />
            <StatCard
              label="Commerciaux"
              value={String(lines.length)}
              icon={Users}
              tone="success"
            />
            <StatCard
              label="Sous l'objectif"
              value={String(belowTarget)}
              icon={AlertTriangle}
              tone={belowTarget > 0 ? "danger" : "success"}
              hint={`Objectif ${formatFCFACompact(OBJECTIF_MENSUEL_COMMERCIAL)}`}
            />
          </div>
          <PayrollTable
            lines={lines}
            contracts={snapshot.contracts}
            plan={snapshot.plan}
          />
        </>
      )}
    </div>
  );
}
