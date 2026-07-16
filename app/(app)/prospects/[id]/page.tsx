"use client";

import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { toast } from "sonner";
import {
  Activity,
  Banknote,
  CalendarClock,
  Calculator,
  Loader2,
  Mail,
  MapPin,
  MessagesSquare,
  Pencil,
  Phone,
} from "lucide-react";
import type { Stage } from "@/lib/types";
import {
  fetchContractsForProspect,
  type ContractItem,
} from "@/lib/data/contracts";
import {
  fetchStageHistory,
  insertStageChange,
  type StageHistoryItem,
} from "@/lib/data/stage-history";
import {
  fetchProspect,
  updateProspectStage,
  type ProspectListItem,
} from "@/lib/data/prospects";
import {
  fetchInteractions,
  type InteractionItem,
} from "@/lib/data/interactions";
import {
  fetchTasksForProspect,
  setTaskStatus,
  type TaskWithRefs,
} from "@/lib/data/tasks";
import { useMockUser } from "@/lib/mock-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StageControl } from "@/components/prospects/detail/stage-control";
import { InteractionsTab } from "@/components/prospects/detail/interactions-tab";
import { TasksTab } from "@/components/prospects/detail/tasks-tab";
import { HistoryTab } from "@/components/prospects/detail/history-tab";
import { ContractsTab } from "@/components/prospects/detail/contracts-tab";
import { ProductBadges } from "@/components/shared/product-badges";
import { formatFCFA } from "@/lib/utils";
import { daysSince, relativeDate } from "@/lib/date";

export default function ProspectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // undefined = loading, null = not found
  const [base, setBase] = useState<ProspectListItem | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let active = true;
    fetchProspect(id)
      .then((p) => active && setBase(p))
      .catch(() => active && setBase(null));
    return () => {
      active = false;
    };
  }, [id]);

  if (base === undefined) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }
  if (base === null) notFound();

  return <ProspectDetailView base={base} />;
}

function ProspectDetailView({ base }: { base: ProspectListItem }) {
  const id = base.id;
  const { user } = useMockUser();

  const [stage, setStage] = useState<Stage>(base.stage);
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [tasks, setTasks] = useState<TaskWithRefs[]>([]);
  const [history, setHistory] = useState<StageHistoryItem[]>([]);
  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [lostReason, setLostReason] = useState<string | undefined>(
    base.lostReason,
  );

  useEffect(() => {
    let active = true;
    fetchInteractions(id)
      .then((r) => active && setInteractions(r))
      .catch(() => {});
    fetchTasksForProspect(id)
      .then((r) => active && setTasks(r))
      .catch(() => {});
    fetchContractsForProspect(id)
      .then((r) => active && setContracts(r))
      .catch(() => {});
    fetchStageHistory(id)
      .then((r) => active && setHistory(r))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  const handleToggleTask = (taskId: string, done: boolean) => {
    const status = done ? "done" : "pending";
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status } : t)),
    );
    setTaskStatus(taskId, status).catch(() =>
      toast.error("La tâche n'a pas pu être mise à jour."),
    );
  };

  const lastActivity = useMemo(() => {
    return interactions[0]?.createdAt ?? base.lastActivityAt;
  }, [interactions, base.lastActivityAt]);

  const handleStageChange = (next: Stage, reason?: string) => {
    const from = stage;
    setHistory((prev) => [
      {
        id: `sh-new-${Date.now()}`,
        prospectId: id,
        from,
        to: next,
        changedBy: user.id,
        changedAt: new Date().toISOString(),
        changedByName: user.name,
      },
      ...prev,
    ]);
    setStage(next);
    setLostReason(next === "lost" ? reason : undefined);
    Promise.all([
      updateProspectStage(id, next, reason),
      insertStageChange(id, from, next, user.id),
    ]).catch(() =>
      toast.error("Le changement de stage n'a pas pu être enregistré."),
    );
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

      <p className="text-sm text-muted-foreground">
        Assigné à <span className="text-foreground">{base.assigneeName}</span>
      </p>

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
                  a.dueDate.localeCompare(b.dueDate),
                ),
              )
            }
            onToggle={handleToggleTask}
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
