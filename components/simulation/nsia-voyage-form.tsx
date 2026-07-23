"use client";

import { useMemo, useState } from "react";
import { Minus, Plane, Plus } from "lucide-react";
import {
  NSIA_AGE_TIERS,
  NSIA_FORMULES,
  nsiaDurations,
  priceNsiaFlat,
  priceNsiaStandard,
  type NsiaVoyageQuote,
} from "@/lib/insurers/nsia-voyage";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NsiaVoyageFormProps {
  onQuote: (quote: NsiaVoyageQuote) => void;
}

// Formules grouped by their `group` label for the select.
const GROUPS = NSIA_FORMULES.reduce<Record<string, typeof NSIA_FORMULES>>(
  (acc, f) => {
    (acc[f.group] ??= []).push(f);
    return acc;
  },
  {},
);

export function NsiaVoyageForm({ onQuote }: NsiaVoyageFormProps) {
  const [formuleKey, setFormuleKey] = useState("europe_schengen_plus");
  const formule = NSIA_FORMULES.find((f) => f.key === formuleKey)!;
  const durations = useMemo(
    () => nsiaDurations(formule.family),
    [formule.family],
  );
  const [durationKey, setDurationKey] = useState(durations[0].key);
  const [counts, setCounts] = useState<Record<string, number>>({
    child: 0,
    adult: 1,
    senior1: 0,
    senior2: 0,
  });
  const [flatCount, setFlatCount] = useState(1);

  const isStandard = formule.family === "standard";

  const onFormuleChange = (key: string) => {
    const next = NSIA_FORMULES.find((f) => f.key === key)!;
    setFormuleKey(key);
    // Reset the duration to the first available for the new family.
    setDurationKey(nsiaDurations(next.family)[0].key);
  };

  const setCount = (tier: string, next: number) =>
    setCounts((prev) => ({ ...prev, [tier]: Math.max(0, Math.min(20, next)) }));

  const standardTotal =
    counts.child + counts.adult + counts.senior1 + counts.senior2;
  const canSubmit = isStandard ? standardTotal >= 1 : flatCount >= 1;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onQuote(
      isStandard
        ? priceNsiaStandard(formuleKey, durationKey, counts)
        : priceNsiaFlat(formuleKey, durationKey, flatCount),
    );
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-sirius-teal" />
            Voyage — NSIA Sénégal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Formule</Label>
              <Select value={formuleKey} onValueChange={onFormuleChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(GROUPS).map(([group, formules]) => (
                    <SelectGroup key={group}>
                      <SelectLabel>{group}</SelectLabel>
                      {formules.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Durée du séjour</Label>
              <Select value={durationKey} onValueChange={setDurationKey}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {durations.map((d) => (
                    <SelectItem key={d.key} value={d.key}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {isStandard ? (
            <div className="space-y-2">
              <Label>Voyageurs (par tranche d&apos;âge)</Label>
              <div className="space-y-2">
                {NSIA_AGE_TIERS.map((t) => (
                  <div
                    key={t.key}
                    className="flex items-center justify-between rounded-md border border-border bg-secondary/40 px-3 py-2"
                  >
                    <span className="text-sm text-foreground">{t.label}</span>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCount(t.key, counts[t.key] - 1)}
                        disabled={counts[t.key] === 0}
                        aria-label={`Moins ${t.label}`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <span className="w-6 text-center text-sm font-semibold text-foreground">
                        {counts[t.key]}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCount(t.key, counts[t.key] + 1)}
                        aria-label={`Plus ${t.label}`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                81–89 ans : plan Schengen uniquement (tarif à confirmer avec
                NSIA).
              </p>
            </div>
          ) : (
            <div className="space-y-1.5 sm:max-w-[200px]">
              <Label htmlFor="nsia-count">Nombre de voyageurs</Label>
              <Input
                id="nsia-count"
                type="number"
                min={1}
                max={20}
                value={flatCount}
                onChange={(e) =>
                  setFlatCount(Math.max(1, Math.min(20, Number(e.target.value))))
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          type="submit"
          size="lg"
          disabled={!canSubmit}
          className="w-full sm:w-auto"
        >
          Calculer le tarif
        </Button>
      </div>
    </form>
  );
}
