"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  FileText,
  Loader2,
  TrendingUp,
  Users as UsersIcon,
} from "lucide-react";
import { isToday } from "date-fns";
import { toast } from "sonner";
import { useMockUser } from "@/lib/mock-auth";
import {
  fetchProspects,
  type ProspectListItem,
} from "@/lib/data/prospects";
import { fetchTasks, type TaskWithRefs } from "@/lib/data/tasks";
import {
  fetchRecentInteractions,
  type RecentActivity,
} from "@/lib/data/interactions";
import {
  buildFunnel,
  buildMonthlyRevenue,
  buildTopCommercials,
} from "@/lib/data/dashboard";
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
import { Button } from "@/components/ui/button";
import { formatFCFACompact } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/constants";

export default function DashboardPage() {
  const { user } = useMockUser();
  const isCommercial = user.role === "commercial";

  const [prospects, setProspects] = useState<ProspectListItem[] | null>(null);
  const [tasks, setTasks] = useState<TaskWithRefs[]>([]);
  const [interactions, setInteractions] = useState<RecentActivity[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetchProspects(),
      fetchTasks(),
      fetchRecentInteractions(10),
    ])
      .then(([ps, ts, its]) => {
        if (!active) return;
        setProspects(ps);
        setTasks(ts);
        setInteractions(its);
      })
      .catch(() => {
        if (!active) return;
        setProspects([]);
        toast.error("Erreur de chargement du tableau de bord.");
      });
    return () => {
      active = false;
    };
  }, [user]);

  const data = useMemo(() => {
    const ps = prospects ?? [];
    const won = ps.filter((p) => p.stage === "won").length;
    const total = ps.length;
    const conversion = total > 0 ? Math.round((won / total) * 100) : 0;
    const pipelineValue = ps
      .filter((p) => p.stage !== "lost")
      .reduce((sum, p) => sum + p.estimatedPremium, 0);
    const overdueTasks = tasks.filter(
      (t) => t.status === "pending" && isOverdue(t.dueDate),
    ).length;
    const todayTasks = tasks.filter(
      (t) => t.status === "pending" && isToday(new Date(t.dueDate)),
    ).length;
    const upcoming = tasks
      .filter((t) => t.status === "pending")
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5);

    return {
      funnel: buildFunnel(ps),
      revenue: buildMonthlyRevenue(ps),
      topCommercials: buildTopCommercials(ps),
      total,
      conversion,
      pipelineValue,
      overdueTasks,
      todayTasks,
      upcoming,
    };
  }, [prospects, tasks]);

  if (prospects === null) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

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
              <RecentActivities items={interactions} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
