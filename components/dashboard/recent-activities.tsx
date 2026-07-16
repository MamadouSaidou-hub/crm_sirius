"use client";

import Link from "next/link";
import {
  FileText,
  MessageCircle,
  MessageSquare,
  Phone,
  MapPin,
  type LucideIcon,
} from "lucide-react";
import type { InteractionType } from "@/lib/types";
import { INTERACTION_LABELS } from "@/lib/constants";
import type { RecentActivity } from "@/lib/data/interactions";
import { UserAvatar } from "@/components/shared/user-avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { relativeDate } from "@/lib/date";
import { Activity } from "lucide-react";

const INTERACTION_ICON: Record<InteractionType, LucideIcon> = {
  call: Phone,
  visit: MapPin,
  note: FileText,
  whatsapp: MessageCircle,
  sms: MessageSquare,
};

export function RecentActivities({ items }: { items: RecentActivity[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="Aucune activité récente"
        description="Les dernières interactions s'afficheront ici."
      />
    );
  }

  return (
    <ul className="divide-y divide-border">
      {items.map((it) => {
        const Icon = INTERACTION_ICON[it.type];
        return (
          <li key={it.id} className="flex items-center gap-3 py-3">
            {it.authorRole && (
              <UserAvatar
                name={it.authorName}
                role={it.authorRole}
                className="h-8 w-8"
              />
            )}
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <Icon className="h-3.5 w-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm text-foreground">
                <span className="font-medium">
                  {INTERACTION_LABELS[it.type]}
                </span>{" "}
                —{" "}
                {it.prospectName ? (
                  <Link
                    href={`/prospects/${it.prospectId}`}
                    className="text-sirius-teal hover:underline"
                  >
                    {it.prospectName}
                  </Link>
                ) : (
                  "Prospect supprimé"
                )}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {it.summary}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {relativeDate(it.createdAt)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
