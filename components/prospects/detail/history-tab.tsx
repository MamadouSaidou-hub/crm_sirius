"use client";

import { ArrowRight, History } from "lucide-react";
import type { StageHistoryEntry } from "@/lib/types";
import { STAGE_LABELS } from "@/lib/constants";
import { getUserById } from "@/lib/mock-data";
import { StageBadge } from "@/components/shared/stage-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { dateTime } from "@/lib/date";

export function HistoryTab({ entries }: { entries: StageHistoryEntry[] }) {
  if (entries.length === 0) {
    return (
      <EmptyState
        icon={History}
        title="Aucun changement de stage"
        description="L'historique apparaîtra lorsque le prospect changera de stage."
      />
    );
  }

  return (
    <ul className="divide-y divide-border rounded-lg border border-border bg-card">
      {entries.map((entry) => {
        const author = getUserById(entry.changedBy);
        return (
          <li
            key={entry.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-2 p-4"
          >
            <div className="flex items-center gap-2">
              {entry.from ? (
                <Badge variant="muted">{STAGE_LABELS[entry.from]}</Badge>
              ) : (
                <Badge variant="outline">Création</Badge>
              )}
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <StageBadge stage={entry.to} />
            </div>
            <span className="ml-auto text-xs text-muted-foreground">
              {dateTime(entry.changedAt)}
              {author ? ` · ${author.name}` : ""}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
