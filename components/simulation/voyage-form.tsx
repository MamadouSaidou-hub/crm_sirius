"use client";

import { useState } from "react";
import { Plane } from "lucide-react";
import type { VoyageRiskData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

interface VoyageFormProps {
  onSimulate: (risk: VoyageRiskData) => void;
}

// Askia doesn't expose a zones referential; only codes 001/002 are valid on the
// test account. Labels are the raw codes — the destination perimeter of each
// zone must be confirmed with Askia.
const ZONES = [
  { code: "001", label: "Zone 001" },
  { code: "002", label: "Zone 002" },
];

export function VoyageForm({ onSimulate }: VoyageFormProps) {
  const [zone, setZone] = useState("001");
  const [durationDays, setDurationDays] = useState("15");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulate({ zone, durationDays: Number(durationDays) });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-4 w-4 text-sirius-teal" />
            Voyage
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Zone de destination</Label>
            <Select value={zone} onValueChange={setZone}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ZONES.map((z) => (
                  <SelectItem key={z.code} value={z.code}>
                    {z.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Périmètre de chaque zone à confirmer avec Askia.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="days">Durée (jours)</Label>
            <Input
              id="days"
              type="number"
              value={durationDays}
              onChange={(e) => setDurationDays(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end">
        <Button type="submit" size="lg">
          Simuler
        </Button>
      </div>
    </form>
  );
}
