"use client";

import {
  FileText,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { MessagesSquare } from "lucide-react";
import type { Interaction, InteractionType } from "@/lib/types";
import { INTERACTION_LABELS } from "@/lib/constants";
import { getUserById } from "@/lib/mock-data";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { AddInteractionDialog } from "@/components/prospects/detail/add-interaction-dialog";
import { dateTime } from "@/lib/date";

const ICONS: Record<InteractionType, LucideIcon> = {
  call: Phone,
  visit: MapPin,
  note: FileText,
  whatsapp: MessageCircle,
  sms: MessageSquare,
};

interface InteractionsTabProps {
  prospectId: string;
  interactions: Interaction[];
  onAdd: (interaction: Interaction) => void;
}

export function InteractionsTab({
  prospectId,
  interactions,
  onAdd,
}: InteractionsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {interactions.length} interaction
          {interactions.length > 1 ? "s" : ""}
        </p>
        <AddInteractionDialog prospectId={prospectId} onAdd={onAdd} />
      </div>

      {interactions.length === 0 ? (
        <EmptyState
          icon={MessagesSquare}
          title="Aucune interaction"
          description="Ajoutez le premier échange avec ce prospect."
        />
      ) : (
        <ol className="relative space-y-5 border-l border-border pl-6">
          {interactions.map((it) => {
            const Icon = ICONS[it.type];
            const author = getUserById(it.createdBy);
            return (
              <li key={it.id} className="relative">
                <span className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-border bg-sirius-muted text-sirius-teal">
                  <Icon className="h-3 w-3" />
                </span>
                <div className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {INTERACTION_LABELS[it.type]}
                      {it.durationMin ? (
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {it.durationMin} min
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {dateTime(it.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {it.summary}
                  </p>
                  {author && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <UserAvatar
                        name={author.name}
                        role={author.role}
                        className="h-5 w-5 text-[9px]"
                      />
                      {author.name}
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
