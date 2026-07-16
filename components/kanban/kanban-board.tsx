"use client";

import { useEffect, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Stage, User } from "@/lib/types";
import { STAGES, STAGE_LABELS } from "@/lib/constants";
import { useMockUser } from "@/lib/mock-auth";
import { fetchAssignableCommercials } from "@/lib/data/profiles";
import {
  fetchProspects,
  updateProspectStage,
  type ProspectListItem,
} from "@/lib/data/prospects";
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
  const showFilter = user.role !== "commercial";

  const [filter, setFilter] = useState<string>("all");
  const [items, setItems] = useState<ProspectListItem[] | null>(null);
  const [commercials, setCommercials] = useState<User[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingLost, setPendingLost] = useState<ProspectListItem | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([fetchProspects(), fetchAssignableCommercials(user)])
      .then(([ps, cs]) => {
        if (!active) return;
        setItems(ps);
        setCommercials(cs);
      })
      .catch(() => {
        if (!active) return;
        setItems([]);
        toast.error("Erreur de chargement du pipeline.");
      });
    return () => {
      active = false;
    };
  }, [user]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const visible = (items ?? []).filter(
    (p) => filter === "all" || p.assignedTo === filter,
  );

  const byStage = (stage: Stage) => visible.filter((p) => p.stage === stage);

  const activeProspect = activeId
    ? (items ?? []).find((p) => p.id === activeId) ?? null
    : null;

  const persistStage = (prospectId: string, stage: Stage, reason?: string) => {
    updateProspectStage(prospectId, stage, reason).catch(() =>
      toast.error("Le déplacement n'a pas pu être enregistré."),
    );
  };

  const moveToStage = (prospectId: string, stage: Stage) => {
    setItems((prev) =>
      (prev ?? []).map((p) => (p.id === prospectId ? { ...p, stage } : p)),
    );
    persistStage(prospectId, stage);
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
      const prospect = (items ?? []).find((p) => p.id === prospectId);
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

  if (items === null) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

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
            <KanbanColumn key={stage} stage={stage} prospects={byStage(stage)} />
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
            const lostId = pendingLost.id;
            setItems((prev) =>
              (prev ?? []).map((p) =>
                p.id === lostId
                  ? { ...p, stage: "lost", lostReason: reason }
                  : p,
              ),
            );
            persistStage(lostId, "lost", reason);
            toast.info("Prospect marqué comme perdu", { description: reason });
          }
          setPendingLost(null);
        }}
      />
    </div>
  );
}
