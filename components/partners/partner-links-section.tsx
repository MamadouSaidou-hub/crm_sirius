"use client";

import { ExternalLink, LayoutDashboard, Link2, Pencil, Share2 } from "lucide-react";
import type { Insurer } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CopyButton } from "@/components/shared/copy-button";

interface PartnerLinksSectionProps {
  insurers: Insurer[];
  canEdit: boolean;
  onEdit: (insurer: Insurer) => void;
}

export function PartnerLinksSection({
  insurers,
  canEdit,
  onEdit,
}: PartnerLinksSectionProps) {
  const withLinks = insurers.filter(
    (i) => i.subscriptionUrl || i.dashboardUrl,
  );
  if (withLinks.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-4 w-4 text-sirius-teal" />
          Liens partenaires
        </CardTitle>
        <CardDescription>
          Portails de souscription partagés aux commerciaux et accès aux tableaux
          de bord cabinet.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {withLinks.map((insurer) => (
          <div
            key={insurer.id}
            className="rounded-lg border border-border bg-secondary/30 p-4"
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-medium text-foreground">{insurer.name}</p>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(insurer)}
                >
                  <Pencil className="h-4 w-4" />
                  Modifier
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <LinkRow
                icon={Share2}
                label="Souscription (commerciaux)"
                url={insurer.subscriptionUrl}
              />
              <LinkRow
                icon={LayoutDashboard}
                label="Tableau de bord cabinet"
                url={insurer.dashboardUrl}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function LinkRow({
  icon: Icon,
  label,
  url,
}: {
  icon: typeof Share2;
  label: string;
  url?: string;
}) {
  if (!url) return null;
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border bg-card px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <p className="truncate font-mono text-xs text-foreground">{url}</p>
      </div>
      <div className="flex shrink-0 gap-2">
        <CopyButton value={url} />
        <Button size="sm" asChild>
          <a href={url} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-4 w-4" />
            Ouvrir
          </a>
        </Button>
      </div>
    </div>
  );
}
