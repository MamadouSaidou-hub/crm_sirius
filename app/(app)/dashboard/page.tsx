"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  FileText,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { useMockUser } from "@/lib/mock-auth";
import { Button } from "@/components/ui/button";
import { scopeProspects, scopeTasks } from "@/lib/access";
import {
  buildFunnel,
  buildMonthlyRevenue,
  buildTopCommercials,
  interactions as allInteractions,
  prospects as allProspects,
  tasks as allTasks,
} from "@/lib/mock-data";
import { isToday } from "date-fns";
import { isOverdue } from "@/lib/date";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { FunnelChart } from "@/components/dashboard/funnel-chart";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import { TopCommercialsChart } from "@/components/dashboard/top-commercials-chart";
import { RecentActivities } from "@/components/dashboard/recent-activities";
import { UpcomingTasks } from "@/components/dashboard/upcoming-tasks";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatFCFACompact } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";

export default function DashboardPage() {
  const { user } = useMockUser();
  const isCommercial = user.role === "commercial";

  const data = useMemo(() => {
    const prospects = scopeProspects(user, allProspects);
    const tasks = scopeTasks(user, allTasks);
    const visibleProspectIds = new Set(prospects.map((p) => p.id));

    const interactions = allInteractions
      .filter((it) => visibleProspectIds.has(it.prospectId))
      .slice(0, 10);

    const won = prospects.filter((p) => p.stage === "won").length;
    const total = prospects.length;
    const conversion = total > 0 ? Math.round((won / total) * 100) : 0;
    const pipelineValue = prospects
      .filter((p) => p.stage !== "lost")
      .reduce((sum, p) => sum + p.estimatedPremium, 0);
    const overdueTasks = tasks.filter(
      (t) => t.status === "pending" && isOverdue(t.dueDate)
    ).length;
    const todayTasks = tasks.filter(
      (t) => t.status === "pending" && isToday(new Date(t.dueDate))
    ).length;

    const upcoming = tasks
      .filter((t) => t.status === "pending")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    return {
      prospects,
      interactions,
      funnel: buildFunnel(prospects),
      revenue: buildMonthlyRevenue(prospects),
      topCommercials: buildTopCommercials(prospects),
      total,
      conversion,
      pipelineValue,
      overdueTasks,
      todayTasks,
      upcoming,
    };
  }, [user]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tableau de bord"
        description={
          isCommercial
            ? `Bonjour ${user.name.split(" ")[0]}, voici votre activité`
            : `Vue ${ROLE_LABELS[user.role].toLowerCase()} — performance de l'équipe`
        }
        actions={
          <Button asChild>
            <Link href="/simulation">
              <FileText className="h-4 w-4" />
              Nouveau devis
            </Link>
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={isCommercial ? "Mes prospects" : "Total prospects"}
          value={String(data.total)}
          icon={UsersIcon}
          tone="teal"
        />
        <StatCard
          label="Taux de conversion"
          value={`${data.conversion} %`}
          icon={TrendingUp}
          hint="Lead → Gagné"
          tone="success"
        />
        <StatCard
          label="CA estimé pipeline"
          value={formatFCFACompact(data.pipelineValue)}
          icon={Banknote}
          tone="gold"
        />
        <StatCard
          label={isCommercial ? "Mes tâches du jour" : "Tâches en retard"}
          value={String(isCommercial ? data.todayTasks : data.overdueTasks)}
          icon={AlertTriangle}
          tone={
            isCommercial
              ? "teal"
              : data.overdueTasks > 0
                ? "danger"
                : "success"
          }
        />
      </div>

      {isCommercial ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Mon funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <FunnelChart data={data.funnel} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Mes prochaines tâches</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingTasks tasks={data.upcoming} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Funnel de conversion</CardTitle>
              </CardHeader>
              <CardContent>
                <FunnelChart data={data.funnel} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>CA estimé (6 mois)</CardTitle>
              </CardHeader>
              <CardContent>
                <RevenueChart data={data.revenue} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Top 5 commerciaux</CardTitle>
              </CardHeader>
              <CardContent>
                <TopCommercialsChart data={data.topCommercials} />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dernières activités</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivities items={data.interactions} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
