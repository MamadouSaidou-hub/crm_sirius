"use client";

import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import type { Prospect } from "@/lib/types";
import { getUserById } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { StageBadge } from "@/components/shared/stage-badge";
import { ProductBadges } from "@/components/shared/product-badges";
import { ProspectActions } from "@/components/prospects/prospect-actions";
import { formatFCFA } from "@/lib/utils";
import { relativeDate } from "@/lib/date";

/** Mobile/tablet representation of a prospect row. */
export function ProspectCard({ prospect }: { prospect: Prospect }) {
  const assignee = getUserById(prospect.assignedTo);
  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/prospects/${prospect.id}`}
              className="font-medium text-foreground hover:text-sirius-gold"
            >
              {prospect.name}
            </Link>
            <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {prospect.phone}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {prospect.city}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <StageBadge stage={prospect.stage} />
            <ProspectActions prospect={prospect} />
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <ProductBadges products={prospect.products} />
          <span className="shrink-0 text-sm font-medium text-foreground">
            {formatFCFA(prospect.estimatedPremium)}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{assignee?.name ?? "Non assigné"}</span>
          <span>Activité {relativeDate(prospect.lastActivityAt)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
