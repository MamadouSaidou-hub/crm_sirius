"use client";

import { useState } from "react";
import { useMockUser } from "@/lib/mock-auth";
import { isAdminLevel } from "@/lib/permissions";
import { CURRENT_PERIOD } from "@/lib/data/performance";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodSelector } from "@/components/performance/period-selector";
import { CommercialPerformance } from "@/components/performance/commercial-performance";
import { ManagerPerformance } from "@/components/performance/manager-performance";
import { AdminPerformance } from "@/components/performance/admin-performance";

export default function PerformancePage() {
  const { user } = useMockUser();
  const [period, setPeriod] = useState(CURRENT_PERIOD);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Objectifs & performance"
        description="Suivi des objectifs et des réalisations"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      {user.role === "commercial" && (
        <CommercialPerformance user={user} period={period} />
      )}
      {user.role === "manager" && (
        <ManagerPerformance user={user} period={period} />
      )}
      {isAdminLevel(user.role) && (
        <AdminPerformance user={user} period={period} />
      )}
      {user.role === "gestionnaire" && (
        <p className="rounded-md border border-border p-4 text-sm text-muted-foreground">
          Le suivi de l&apos;objectif de production de chaque commercial se
          trouve dans la page Paie.
        </p>
      )}
    </div>
  );
}
