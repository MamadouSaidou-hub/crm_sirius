"use client";

import { useState } from "react";
import { Minus, Plane, Plus } from "lucide-react";
import {
  AXA_AGE_BANDS,
  AXA_DURATIONS,
  AXA_ZONES,
  priceAxaVoyage,
  type AxaAgeBand,
  type AxaDurationKey,
  type AxaVoyageQuote,
  type AxaZone,
} from "@/lib/insurers/axa-voyage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AxaVoyageFormProps {
  onQuote: (quote: AxaVoyageQuote) => void;
}

export function AxaVoyageForm({ onQuote }: AxaVoyageFormProps) {
  const [zone, setZone] = useState<AxaZone>("zone1");
  const [duration, setDuration] = useState<AxaDurationKey>("d15");
  const [counts, setCounts] = useState<Record<AxaAgeBand, number>>({
    child: 0,
    adult: 1,
    senior: 0,
  });

  const total = counts.child + counts.adult + counts.senior;

  const setCount = (band: AxaAgeBand, next: number) =>
    setCounts((prev) => ({ ...prev, [band]: Math.max(0, Math.min(20, next)) }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (total < 1) return;
    const travelers = AXA_AGE_BANDS.map((b) => ({
      band: b.key,
      count: counts[b.key],
    }));
    onQuote(priceAxaVoyage(zone, duration, travelers));
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-sirius-teal" />
            Voyage — AXA Sénégal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Zone de destination</Label>
              <Select value={zone} onValueChange={(v) => setZone(v as AxaZone)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AXA_ZONES.map((z) => (
                    <SelectItem key={z.key} value={z.key}>
                      {z.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durée du séjour</Label>
              <Select
                value={duration}
                onValueChange={(v) => setDuration(v as AxaDurationKey)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AXA_DURATIONS.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Voyageurs</Label>
            <div className="space-y-2">
              {AXA_AGE_BANDS.map((b) => (
                <div
                  key={b.key}
                  className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2"
                >
                  <span className="text-sm text-foreground">{b.label}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCount(b.key, counts[b.key] - 1)}
                      disabled={counts[b.key] === 0}
                      aria-label={`Moins ${b.label}`}
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </Button>
                    <span className="w-6 text-center text-sm font-semibold text-foreground">
                      {counts[b.key]}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setCount(b.key, counts[b.key] + 1)}
                      aria-label={`Plus ${b.label}`}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Au-delà de 74 ans : non couvert (limite d&apos;âge AXA).
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={total < 1} className="w-full sm:w-auto">
          Calculer le tarif ({total} voyageur{total > 1 ? "s" : ""})
        </Button>
      </div>
    </form>
  );
}
