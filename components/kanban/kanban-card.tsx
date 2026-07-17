"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, MoveRight, Phone } from "lucide-react";
import type { Stage } from "@/lib/types";
import type { ProspectListItem } from "@/lib/data/prospects";
import { STAGES, STAGE_LABELS, PRODUCT_LABELS } from "@/lib/constants";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFCFACompact } from "@/lib/utils";
import { relativeDate } from "@/lib/date";
import { cn } from "@/lib/utils";

interface KanbanCardProps {
  prospect: ProspectListItem;
  overlay?: boolean;
  /** Move the prospect to another stage (tap-friendly alternative to drag). */
  onMove?: (prospectId: string, stage: Stage) => void;
}

export function KanbanCard({
  prospect,
  overlay = false,
  onMove,
}: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: prospect.id, data: { stage: prospect.stage } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn(
        "group rounded-lg border border-border bg-sirius-muted p-3 shadow-sm",
        isDragging && !overlay && "opacity-40",
        overlay && "cursor-grabbing shadow-xl ring-1 ring-sirius-gold/40",
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
        <div className="flex shrink-0 items-center">
          {onMove && !overlay && (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Déplacer vers un stage"
              >
                <MoveRight className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuLabel>Déplacer vers</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {STAGES.filter((s) => s !== prospect.stage).map((s) => (
                  <DropdownMenuItem
                    key={s}
                    onClick={() => onMove(prospect.id, s)}
                  >
                    {STAGE_LABELS[s]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <button
            type="button"
            className="cursor-grab touch-none text-muted-foreground opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100"
            {...attributes}
            {...listeners}
            aria-label="Déplacer"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        </div>
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
        {prospect.assigneeRole && (
          <UserAvatar
            name={prospect.assigneeName}
            role={prospect.assigneeRole}
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
