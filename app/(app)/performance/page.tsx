"use client";

import { useReducer, useState } from "react";
import { useMockUser } from "@/lib/mock-auth";
import { CURRENT_PERIOD } from "@/lib/store/performance";
import { PageHeader } from "@/components/shared/page-header";
import { PeriodSelector } from "@/components/performance/period-selector";
import { CommercialPerformance } from "@/components/performance/commercial-performance";
import { ManagerPerformance } from "@/components/performance/manager-performance";
import { AdminPerformance } from "@/components/performance/admin-performance";

export default function PerformancePage() {
  const { user } = useMockUser();
  const [period, setPeriod] = useState(CURRENT_PERIOD);
  // Force a re-read of the in-session store after mutations.
  const [, refresh] = useReducer((x: number) => x + 1, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Objectifs & performance"
        description="Suivi des objectifs et des réalisations"
        actions={<PeriodSelector value={period} onChange={setPeriod} />}
      />

      {user.role === "commercial" && (
        <CommercialPerformance user={user} period={period} refresh={refresh} />
      )}
      {user.role === "manager" && (
        <ManagerPerformance user={user} period={period} refresh={refresh} />
      )}
      {user.role === "admin" && (
        <AdminPerformance user={user} period={period} refresh={refresh} />
      )}
    </div>
  );
}
