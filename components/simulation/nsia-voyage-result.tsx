"use client";

import { Info, ShieldCheck } from "lucide-react";
import {
  NSIA_VOYAGE_NOTES,
  type NsiaVoyageQuote,
} from "@/lib/insurers/nsia-voyage";
import { Card, CardContent } from "@/components/ui/card";
import { formatFCFA } from "@/lib/utils";

export function NsiaVoyageResult({ quote }: { quote: NsiaVoyageQuote }) {
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border-sirius-gold/30">
        <CardContent className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-sirius-gold" />
                NSIA Sénégal — Assurance Voyage
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {quote.formuleLabel} · {quote.durationLabel} · {quote.travelers}{" "}
                voyageur{quote.travelers > 1 ? "s" : ""}
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
                key={line.label}
                className="flex items-center justify-between gap-2 px-3 py-2 text-sm"
              >
                <span className="text-foreground">
                  {line.count} × {line.label}
                </span>
                <span className="text-muted-foreground">
                  {formatFCFA(line.unitTtc)} / pers.
                </span>
                <span className="font-medium text-foreground">
                  {formatFCFA(line.subtotal)}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-1.5 rounded-md border border-border bg-secondary/30 p-3">
        {NSIA_VOYAGE_NOTES.map((note) => (
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
