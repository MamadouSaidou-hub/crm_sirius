"use client";

import { ListTodo } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { TaskItem } from "@/components/tasks/task-item";
import { TaskDialog } from "@/components/tasks/task-dialog";
import type { TaskWithRefs } from "@/lib/data/tasks";

interface TasksTabProps {
  prospectId: string;
  tasks: TaskWithRefs[];
  onAdd: (task: TaskWithRefs) => void;
  onToggle: (id: string, done: boolean) => void;
}

export function TasksTab({
  prospectId,
  tasks,
  onAdd,
  onToggle,
}: TasksTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {tasks.length} tâche{tasks.length > 1 ? "s" : ""}
        </p>
        <TaskDialog fixedProspectId={prospectId} onAdd={onAdd} />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="Aucune tâche"
          description="Planifiez une action de suivi pour ce prospect."
        />
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border bg-card px-4">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={onToggle}
              showProspect={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
