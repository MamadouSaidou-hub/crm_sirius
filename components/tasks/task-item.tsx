"use client";

import Link from "next/link";
import { toast } from "sonner";
import { TASK_TYPE_LABELS } from "@/lib/constants";
import type { TaskWithRefs } from "@/lib/data/tasks";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { dueLabel, isOverdue } from "@/lib/date";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: TaskWithRefs;
  onToggle: (id: string, done: boolean) => void;
  /** Show the linked prospect name (hidden on the prospect detail page). */
  showProspect?: boolean;
  /** Show the assignee (useful for managers/admins). */
  showAssignee?: boolean;
}

export function TaskItem({
  task,
  onToggle,
  showProspect = true,
  showAssignee = false,
}: TaskItemProps) {
  const done = task.status === "done";
  const cancelled = task.status === "cancelled";
  const overdue = task.status === "pending" && isOverdue(task.dueDate);

  return (
    <div className="flex items-center gap-3 py-3">
      <Checkbox
        checked={done}
        disabled={cancelled}
        onCheckedChange={(checked) => {
          const next = checked === true;
          onToggle(task.id, next);
          if (next) toast.success("Tâche complétée");
        }}
        className="mt-0.5"
      />
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "truncate text-sm font-medium text-foreground transition-all",
            (done || cancelled) && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          {showProspect && task.prospectId && task.prospectName && (
            <Link
              href={`/prospects/${task.prospectId}`}
              className="text-sirius-teal hover:underline"
            >
              {task.prospectName}
            </Link>
          )}
          {showAssignee && <span>· {task.assigneeName}</span>}
        </div>
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
    </div>
  );
}
