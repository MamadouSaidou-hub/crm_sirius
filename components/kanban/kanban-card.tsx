"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Phone } from "lucide-react";
import type { Prospect } from "@/lib/types";
import { getUserById } from "@/lib/mock-data";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import { PRODUCT_LABELS } from "@/lib/constants";
import { formatFCFACompact } from "@/lib/utils";
import { relativeDate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  prospect: Prospect;
  overlay?: boolean;
}

export function KanbanCard({ prospect, overlay = false }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: prospect.id, data: { stage: prospect.stage } });

  const assignee = getUserById(prospect.assignedTo);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "group rounded-lg border border-border bg-sirius-muted p-3 shadow-sm",
        isDragging && !overlay && "opacity-40",
        overlay && "cursor-grabbing shadow-xl ring-1 ring-sirius-gold/40"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {prospect.name}
          </p>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            {prospect.phone}
          </p>
        </div>
        <button
          type="button"
          className="cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
          {...attributes}
          {...listeners}
          aria-label="Déplacer"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-2 flex flex-wrap gap-1">
        {prospect.products.map((p) => (
          <Badge key={p} variant="outline" className="text-[10px]">
            {PRODUCT_LABELS[p]}
          </Badge>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-sirius-gold">
          {formatFCFACompact(prospect.estimatedPremium)}
        </span>
        {assignee && (
          <UserAvatar
            name={assignee.name}
            role={assignee.role}
            className="h-6 w-6 text-[9px]"
          />
        )}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground">
        Créé {relativeDate(prospect.createdAt)}
      </p>
    </div>
  );
}
