"use client";

import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { TASK_TYPE_LABELS } from "@/lib/constants";
import type { TaskWithRefs } from "@/lib/data/tasks";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { dueLabel, isOverdue } from "@/lib/date";
import { cn } from "@/lib/utils";

export function UpcomingTasks({ tasks }: { tasks: TaskWithRefs[] }) {
  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={CalendarCheck}
        title="Aucune tâche à venir"
        description="Vous êtes à jour. 🎉"
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {tasks.map((task) => {
        const overdue = isOverdue(task.dueDate);
        return (
          <li key={task.id} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">
                {task.title}
              </p>
              {task.prospectId && task.prospectName && (
                <Link
                  href={`/prospects/${task.prospectId}`}
                  className="text-xs text-sirius-teal hover:underline"
                >
                  {task.prospectName}
                </Link>
              )}
            </div>
            <Badge variant="muted">{TASK_TYPE_LABELS[task.type]}</Badge>
            <span
              className={cn(
                "shrink-0 text-xs",
                overdue ? "font-medium text-sirius-danger" : "text-muted-foreground"
              )}
            >
              {dueLabel(task.dueDate)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
