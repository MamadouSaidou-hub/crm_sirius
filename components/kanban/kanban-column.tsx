"use client";

import { useDroppable } from "@dnd-kit/core";
import type { Stage } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/constants";
import type { ProspectListItem } from "@/lib/data/prospects";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { formatFCFACompact } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  stage: Stage;
  prospects: ProspectListItem[];
  onMove?: (prospectId: string, stage: Stage) => void;
}

const COLUMN_TONE: Partial<Record<Stage, string>> = {
  won: "bg-sirius-success/5 border-sirius-success/30",
  lost: "bg-sirius-danger/5 border-sirius-danger/30",
};

export function KanbanColumn({ stage, prospects, onMove }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = prospects.reduce((sum, p) => sum + p.estimatedPremium, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex w-[280px] shrink-0 flex-col rounded-lg border bg-card/40 transition-colors",
        COLUMN_TONE[stage] ?? "border-border",
        isOver && "ring-2 ring-sirius-gold/50"
      )}
    >
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground">
            {STAGE_LABELS[stage]}
          </span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
            {prospects.length}
          </span>
        </div>
        <span className="text-xs font-medium text-muted-foreground">
          {formatFCFACompact(total)}
        </span>
      </div>

      <div className="flex max-h-[calc(100vh-280px)] flex-col gap-2 overflow-y-auto scrollbar-thin p-2">
        {prospects.length === 0 ? (
          <p className="rounded-md border border-dashed border-border/60 py-8 text-center text-xs text-muted-foreground">
            Aucun prospect
          </p>
        ) : (
          prospects.map((p) => (
            <KanbanCard key={p.id} prospect={p} onMove={onMove} />
          ))
        )}
      </div>
    </div>
  );
}
