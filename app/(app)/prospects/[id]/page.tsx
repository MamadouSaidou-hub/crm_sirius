"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  Banknote,
  CalendarClock,
  Calculator,
  Mail,
  MapPin,
  MessagesSquare,
  Pencil,
  Phone,
} from "lucide-react";
import type {
  Contract,
  Interaction,
  Stage,
  StageHistoryEntry,
  Task,
} from "@/lib/types";
import {
  getInteractionsForProspect,
  getProspectById,
  getStageHistoryForProspect,
  getTasksForProspect,
} from "@/lib/mock-data";
import { useMockUser } from "@/lib/mock-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageControl } from "@/components/prospects/detail/stage-control";
import { InteractionsTab } from "@/components/prospects/detail/interactions-tab";
import { TasksTab } from "@/components/prospects/detail/tasks-tab";
import { HistoryTab } from "@/components/prospects/detail/history-tab";
import { ContractsTab } from "@/components/prospects/detail/contracts-tab";
import { getContractsForProspect } from "@/lib/store/subscriptions";
import { ProductBadges } from "@/components/shared/product-badges";
import { getUserById } from "@/lib/mock-data";
import { formatFCFA } from "@/lib/utils";
import { daysSince, relativeDate } from "@/lib/date";

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { user } = useMockUser();
  const base = getProspectById(id);
  if (!base) notFound();

  const [stage, setStage] = useState<Stage>(base.stage);
  const [interactions, setInteractions] = useState<Interaction[]>(() =>
    getInteractionsForProspect(id)
  );
  const [tasks, setTasks] = useState<Task[]>(() => getTasksForProspect(id));
  const [history, setHistory] = useState<StageHistoryEntry[]>(() =>
    getStageHistoryForProspect(id)
  );
  const [contracts] = useState<Contract[]>(() => getContractsForProspect(id));
  const [lostReason, setLostReason] = useState<string | undefined>(
    base.lostReason
  );

  const assignee = getUserById(base.assignedTo);

  const lastActivity = useMemo(() => {
    const latest = interactions[0]?.createdAt ?? base.lastActivityAt;
    return latest;
  }, [interactions, base.lastActivityAt]);

  const handleStageChange = (next: Stage, reason?: string) => {
    setHistory((prev) => [
      {
        id: `sh-new-${Date.now()}`,
        prospectId: id,
        from: stage,
        to: next,
        changedBy: user.id,
        changedAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setStage(next);
    setLostReason(next === "lost" ? reason : undefined);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground">
            {base.name}
          </h1>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5" />
              {base.phone}
            </span>
            {base.email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {base.email}
              </span>
            )}
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {base.city}
            </span>
          </div>
          <div className="pt-1">
            <ProductBadges products={base.products} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Stage</span>
            <StageControl
              stage={stage}
              prospectName={base.name}
              onStageChange={handleStageChange}
            />
          </div>
          <Button asChild>
            <Link href={`/prospects/${id}/simulation`}>
              <Calculator className="h-4 w-4" />
              Simuler un devis
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/prospects/${id}/edit`}>
              <Pencil className="h-4 w-4" />
              Modifier
            </Link>
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Metric
          icon={Banknote}
          label="Prime estimée"
          value={formatFCFA(base.estimatedPremium)}
        />
        <Metric
          icon={MessagesSquare}
          label="Interactions"
          value={String(interactions.length)}
        />
        <Metric
          icon={CalendarClock}
          label="Jours dans le pipeline"
          value={String(daysSince(base.createdAt))}
        />
        <Metric
          icon={Activity}
          label="Dernière activité"
          value={relativeDate(lastActivity)}
        />
      </div>

      {stage === "lost" && lostReason && (
        <div className="rounded-md border border-sirius-danger/30 bg-sirius-danger/10 px-4 py-2.5 text-sm text-sirius-danger">
          <span className="font-medium">Motif de perte :</span> {lostReason}
        </div>
      )}

      {assignee && (
        <p className="text-sm text-muted-foreground">
          Assigné à <span className="text-foreground">{assignee.name}</span>
        </p>
      )}

      {/* Tabs */}
      <Tabs defaultValue="interactions">
        <TabsList>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="contracts">Devis &amp; contrats</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        <TabsContent value="interactions">
          <InteractionsTab
            prospectId={id}
            interactions={interactions}
            onAdd={(it) => setInteractions((prev) => [it, ...prev])}
          />
        </TabsContent>
        <TabsContent value="tasks">
          <TasksTab
            prospectId={id}
            tasks={tasks}
            onAdd={(task) =>
              setTasks((prev) =>
                [task, ...prev].sort((a, b) =>
                  a.dueDate.localeCompare(b.dueDate)
                )
              )
            }
            onToggle={(taskId, done) =>
              setTasks((prev) =>
                prev.map((t) =>
                  t.id === taskId
                    ? { ...t, status: done ? "done" : "pending" }
                    : t
                )
              )
            }
          />
        </TabsContent>
        <TabsContent value="contracts">
          <ContractsTab prospectId={id} contracts={contracts} />
        </TabsContent>
        <TabsContent value="history">
          <HistoryTab entries={history} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Banknote;
  label: string;
  value: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-sirius-teal">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="truncate text-sm font-semibold text-foreground">
            {value}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
