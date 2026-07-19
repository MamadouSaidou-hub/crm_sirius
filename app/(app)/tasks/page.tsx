"use client";

import { useEffect, useMemo, useState } from "react";
import { isPast, isToday, isWithinInterval, startOfDay } from "date-fns";
import {
  AlertTriangle,
  CalendarCheck,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import type { User } from "@/lib/types";
import { useMockUser } from "@/lib/mock-auth";
import { type TaskWithRefs } from "@/lib/data/tasks";
import { submitTaskStatus } from "@/lib/offline/writes";
import { loadTasks } from "@/lib/offline/reads";
import { fetchAssignableCommercials } from "@/lib/data/profiles";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskDialog } from "@/components/tasks/task-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fullDate } from "@/lib/date";
import { cn } from "@/lib/utils";

export default function TasksPage() {
  const { user } = useMockUser();
  const canFilter = user.role !== "commercial";

  const [filter, setFilter] = useState<string>("all");
  const [tasks, setTasks] = useState<TaskWithRefs[] | null>(null);
  const [commercials, setCommercials] = useState<User[]>([]);

  useEffect(() => {
    let active = true;
    Promise.all([loadTasks(user), fetchAssignableCommercials(user)])
      .then(([ts, cs]) => {
        if (!active) return;
        setTasks(ts);
        setCommercials(cs);
      })
      .catch(() => {
        if (!active) return;
        setTasks([]);
        toast.error("Erreur de chargement des tâches.");
      });
    return () => {
      active = false;
    };
  }, [user]);

  const visible = (tasks ?? []).filter((t) => {
    if (filter === "all") return true;
    if (filter === "mine") return t.assignedTo === user.id;
    return t.assignedTo === filter;
  });

  const buckets = useMemo(() => {
    const overdue: TaskWithRefs[] = [];
    const today: TaskWithRefs[] = [];
    const upcoming: TaskWithRefs[] = [];
    const now = new Date();
    const in7 = new Date();
    in7.setDate(in7.getDate() + 7);

    for (const t of visible) {
      if (t.status !== "pending") continue;
      const due = new Date(t.dueDate);
      if (isToday(due)) today.push(t);
      else if (isPast(due)) overdue.push(t);
      else if (isWithinInterval(due, { start: startOfDay(now), end: in7 }))
        upcoming.push(t);
    }
    overdue.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    today.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    upcoming.sort((a, b) => a.dueDate.localeCompare(b.dueDate));

    const grouped = new Map<string, TaskWithRefs[]>();
    for (const t of upcoming) {
      const key = fullDate(t.dueDate);
      const arr = grouped.get(key) ?? [];
      arr.push(t);
      grouped.set(key, arr);
    }
    return { overdue, today, upcomingGroups: grouped };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, filter]);

  const onToggle = (id: string, done: boolean) => {
    const status = done ? "done" : "pending";
    setTasks((prev) =>
      (prev ?? []).map((t) => (t.id === id ? { ...t, status } : t)),
    );
    submitTaskStatus(id, status).catch(() =>
      toast.error("La tâche n'a pas pu être mise à jour."),
    );
  };

  const addTask = (task: TaskWithRefs) =>
    setTasks((prev) => [task, ...(prev ?? [])]);

  const showAssignee = user.role !== "commercial";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tâches"
        description="Vos actions de suivi, classées par échéance"
        actions={
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="h-9 w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les tâches</SelectItem>
                <SelectItem value="mine">Mes tâches</SelectItem>
                {canFilter &&
                  commercials
                    .filter((c) => c.id !== user.id)
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
              </SelectContent>
            </Select>
            <TaskDialog onAdd={addTask} />
          </div>
        }
      />

      {tasks === null ? (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-16 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement des tâches…
        </div>
      ) : (
        <>
          <Section
            title="En retard"
            icon={AlertTriangle}
            count={buckets.overdue.length}
            tone="danger"
          >
            {buckets.overdue.length === 0 ? (
              <EmptyState
                icon={CalendarCheck}
                title="Aucune tâche en retard"
                description="Bravo, tout est à jour."
              />
            ) : (
              <TaskList
                tasks={buckets.overdue}
                onToggle={onToggle}
                showAssignee={showAssignee}
              />
            )}
          </Section>

          <Section
            title="Aujourd'hui"
            icon={CalendarCheck}
            count={buckets.today.length}
            tone="teal"
          >
            {buckets.today.length === 0 ? (
              <EmptyState icon={CalendarCheck} title="Rien de prévu aujourd'hui" />
            ) : (
              <TaskList
                tasks={buckets.today}
                onToggle={onToggle}
                showAssignee={showAssignee}
              />
            )}
          </Section>

          <Section
            title="À venir (7 jours)"
            icon={CalendarDays}
            count={[...buckets.upcomingGroups.values()].reduce(
              (s, a) => s + a.length,
              0,
            )}
            tone="gold"
          >
            {buckets.upcomingGroups.size === 0 ? (
              <EmptyState
                icon={CalendarDays}
                title="Aucune tâche à venir"
                description="Les 7 prochains jours sont libres."
              />
            ) : (
              <div className="space-y-4">
                {[...buckets.upcomingGroups.entries()].map(([day, dayTasks]) => (
                  <div key={day}>
                    <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {day}
                    </p>
                    <TaskList
                      tasks={dayTasks}
                      onToggle={onToggle}
                      showAssignee={showAssignee}
                    />
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({
  title,
  icon: Icon,
  count,
  tone,
  children,
}: {
  title: string;
  icon: typeof AlertTriangle;
  count: number;
  tone: "danger" | "teal" | "gold";
  children: React.ReactNode;
}) {
  const toneClass = {
    danger: "text-sirius-danger",
    teal: "text-sirius-teal",
    gold: "text-sirius-gold",
  }[tone];

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className={cn("h-4 w-4", toneClass)} />
          {title}
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs font-normal text-muted-foreground">
            {count}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function TaskList({
  tasks,
  onToggle,
  showAssignee,
}: {
  tasks: TaskWithRefs[];
  onToggle: (id: string, done: boolean) => void;
  showAssignee: boolean;
}) {
  return (
    <div className="divide-y divide-border">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={onToggle}
          showAssignee={showAssignee}
        />
      ))}
    </div>
  );
}
