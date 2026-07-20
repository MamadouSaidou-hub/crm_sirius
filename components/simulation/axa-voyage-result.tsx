"use client";

import { Info, ShieldCheck } from "lucide-react";
import {
  AXA_DURATIONS,
  AXA_VOYAGE_NOTES,
  AXA_ZONES,
  type AxaVoyageQuote,
} from "@/lib/insurers/axa-voyage";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";

export function AxaVoyageResult({ quote }: { quote: AxaVoyageQuote }) {
  const zoneLabel = AXA_ZONES.find((z) => z.key === quote.zone)?.label ?? "";
  const durationLabel =
    AXA_DURATIONS.find((d) => d.key === quote.duration)?.label ?? "";

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-sirius-gold/30">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-sirius-gold" />
                AXA Sénégal — Assurance Voyage
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {zoneLabel} · {durationLabel} · {quote.travelers} voyageur
                {quote.travelers > 1 ? "s" : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Prime TTC</p>
              <p className="font-heading text-2xl font-bold text-sirius-gold">
                {formatFCFA(quote.totalTtc)}
              </p>
            </div>
          </div>

          <div className="space-y-1.5 rounded-md border border-border">
            {quote.lines.map((line) => (
              <div
                key={line.band}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-foreground">
                  {line.count} × {line.label}
                </span>
                <span className="text-muted-foreground">
                  {formatFCFA(line.unit.ttc)} / pers.
                </span>
                <span className="font-medium text-foreground">
                  {formatFCFA(line.subtotalTtc)}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 text-sm">
            <Metric label="Prime nette" value={formatFCFA(quote.totalPn)} />
            <Metric label="Accessoires" value={formatFCFA(quote.totalCout)} />
            <Metric label="Taxes" value={formatFCFA(quote.totalTaxe)} />
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5 rounded-md border border-border bg-secondary/30 p-3">
        {AXA_VOYAGE_NOTES.map((note) => (
          <p
            key={note}
            className="flex items-start gap-2 text-xs text-muted-foreground"
          >
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sirius-teal" />
            <span>{note}</span>
          </p>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-secondary/40 px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="truncate font-semibold text-foreground">{value}</p>
    </div>
  );
}
