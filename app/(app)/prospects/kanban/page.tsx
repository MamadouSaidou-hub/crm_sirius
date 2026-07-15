"use client";

import { PageHeader } from "@/components/shared/page-header";
import { KanbanBoard } from "@/components/kanban/kanban-board";

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Glissez-déposez les prospects pour faire évoluer leur stage"
      />
      <KanbanBoard />
    </div>
  );
}
