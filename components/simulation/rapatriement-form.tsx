"use client";

import { useState } from "react";
import { LifeBuoy } from "lucide-react";
import type { RapatriementRiskData } from "@/lib/types";
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

interface RapatriementFormProps {
  onSimulate: (risk: RapatriementRiskData) => void;
}

const FORMULES = [
  { code: "01", label: "Individuel" },
  { code: "02", label: "Famille (2 adultes + 3 enfants max)" },
];

export function RapatriementForm({ onSimulate }: RapatriementFormProps) {
  const [formula, setFormula] = useState("01");
  const [extraAdults, setExtraAdults] = useState("0");
  const [extraChildren, setExtraChildren] = useState("0");
  const [seniors, setSeniors] = useState("0");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulate({
      formula,
      extraAdults: Number(extraAdults),
      extraChildren: Number(extraChildren),
      seniors: Number(seniors),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-sirius-teal" />
            Rapatriement
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label>Formule</Label>
            <Select value={formula} onValueChange={setFormula}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMULES.map((f) => (
                  <SelectItem key={f.code} value={f.code}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="adults">Adultes suppl.</Label>
            <Input
              id="adults"
              type="number"
              value={extraAdults}
              onChange={(e) => setExtraAdults(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="children">Enfants suppl.</Label>
            <Input
              id="children"
              type="number"
              value={extraChildren}
              onChange={(e) => setExtraChildren(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="seniors">+ de 80 ans</Label>
            <Input
              id="seniors"
              type="number"
              value={seniors}
              onChange={(e) => setSeniors(e.target.value)}
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
