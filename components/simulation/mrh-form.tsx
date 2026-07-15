"use client";

import { useState } from "react";
import { Home } from "lucide-react";
import type { MrhRiskData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface MrhFormProps {
  onSimulate: (risk: MrhRiskData) => void;
}

export function MrhForm({ onSimulate }: MrhFormProps) {
  const [contentsValue, setContentsValue] = useState("6000000");
  const [rooms, setRooms] = useState("4");
  const [durationMonths, setDurationMonths] = useState("12");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSimulate({
      contentsValue: Number(contentsValue),
      rooms: Number(rooms),
      durationMonths: Number(durationMonths),
    });
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="h-4 w-4 text-sirius-teal" />
            Habitation
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="cntn">Valeur du contenu (FCFA)</Label>
            <Input
              id="cntn"
              type="number"
              step={100_000}
              value={contentsValue}
              onChange={(e) => setContentsValue(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="rooms">Nombre de pièces</Label>
            <Input
              id="rooms"
              type="number"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="duree">Durée (mois)</Label>
            <Input
              id="duree"
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
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
