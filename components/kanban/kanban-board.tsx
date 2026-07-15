"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { toast } from "sonner";
import type { Prospect, Stage } from "@/lib/types";
import { STAGES, STAGE_LABELS } from "@/lib/constants";
import { useMockUser } from "@/lib/mock-auth";
import { assignableCommercials, scopeProspects } from "@/lib/access";
import { prospects as allProspects } from "@/lib/mock-data";
import { KanbanColumn } from "@/components/kanban/kanban-column";
import { KanbanCard } from "@/components/kanban/kanban-card";
import { LostReasonDialog } from "@/components/prospects/lost-reason-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function KanbanBoard() {
  const { user } = useMockUser();
  const commercials = useMemo(() => assignableCommercials(user), [user]);
  const showFilter = user.role !== "commercial";

  const [filter, setFilter] = useState<string>("all");
  const [items, setItems] = useState<Prospect[]>(() =>
    scopeProspects(user, allProspects).map((p) => ({ ...p }))
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingLost, setPendingLost] = useState<Prospect | null>(null);

  // Re-scope when the impersonated user changes.
  const scopedIds = useMemo(
    () => new Set(scopeProspects(user, allProspects).map((p) => p.id)),
    [user]
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const visible = items.filter(
    (p) =>
      scopedIds.has(p.id) && (filter === "all" || p.assignedTo === filter)
  );

  const byStage = (stage: Stage) => visible.filter((p) => p.stage === stage);

  const activeProspect = activeId
    ? items.find((p) => p.id === activeId) ?? null
    : null;

  const moveToStage = (prospectId: string, stage: Stage) => {
    setItems((prev) =>
      prev.map((p) => (p.id === prospectId ? { ...p, stage } : p))
    );
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const prospectId = String(active.id);
    const targetStage = over.id as Stage;
    const sourceStage = active.data.current?.stage as Stage | undefined;
    if (!STAGES.includes(targetStage) || targetStage === sourceStage) return;

    if (targetStage === "lost") {
      const prospect = items.find((p) => p.id === prospectId);
      if (prospect) setPendingLost(prospect);
      return;
    }

    moveToStage(prospectId, targetStage);
    if (targetStage === "won") {
      toast.success("🎉 Prospect gagné !");
    } else {
      toast.success("Stage mis à jour", {
        description: `Déplacé vers « ${STAGE_LABELS[targetStage]} ».`,
      });
    }
  };

  return (
    <div className="space-y-4">
      {showFilter && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Commercial :</span>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="h-9 w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les commerciaux</SelectItem>
              {commercials.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto scrollbar-thin pb-4">
          {STAGES.map((stage) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              prospects={byStage(stage)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeProspect ? (
            <KanbanCard prospect={activeProspect} overlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <LostReasonDialog
        open={pendingLost !== null}
        onOpenChange={(o) => {
          if (!o) setPendingLost(null);
        }}
        prospectName={pendingLost?.name ?? ""}
        onConfirm={(reason) => {
          if (pendingLost) {
            setItems((prev) =>
              prev.map((p) =>
                p.id === pendingLost.id
                  ? { ...p, stage: "lost", lostReason: reason }
                  : p
              )
            );
            toast.info("Prospect marqué comme perdu", { description: reason });
          }
          setPendingLost(null);
        }}
      />
    </div>
  );
}
