"use client";

import { useState } from "react";
import { ExternalLink, Share2, ShieldCheck } from "lucide-react";
import { getInsurerById } from "@/lib/mock-data";
import { listSubscriptionPortals } from "@/lib/store/partner-links";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShareLinkDialog } from "@/components/performance/share-link-dialog";

/**
 * Commercial-facing card: open a partner's subscription portal (e.g. NSIA Vie)
 * or share the link with a prospect (WhatsApp / email / QR), then declare the
 * realization below for validation.
 */
export function PartnerPortalsCard() {
  const portals = listSubscriptionPortals();
  const [share, setShare] = useState<{ name: string; url: string } | null>(
    null,
  );

  if (portals.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Souscrire chez un partenaire</CardTitle>
        <CardDescription>
          Partagez le lien avec le prospect ou ouvrez le portail, puis déclarez
          votre réalisation ci-dessous pour validation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {portals.map(({ insurerId, url }) => {
          const insurer = getInsurerById(insurerId);
          const name = insurer?.name ?? "Partenaire";
          return (
            <div
              key={insurerId}
              className="flex flex-col gap-3 rounded-md border border-border bg-secondary/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-sirius-teal" />
                <span className="text-sm font-medium text-foreground">
                  {name}
                </span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => setShare({ name, url })}>
                  <Share2 className="h-4 w-4" />
                  Partager le lien
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                    Ouvrir
                  </a>
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>

      {share && (
        <ShareLinkDialog
          open={share !== null}
          onOpenChange={(o) => {
            if (!o) setShare(null);
          }}
          insurerName={share.name}
          url={share.url}
        />
      )}
    </Card>
  );
}
