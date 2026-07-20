"use client";

import { useState } from "react";
import type { AxaVoyageQuote } from "@/lib/insurers/axa-voyage";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AskiaProductSimulation } from "@/components/simulation/askia-product-simulation";
import { AxaVoyageForm } from "@/components/simulation/axa-voyage-form";
import { AxaVoyageResult } from "@/components/simulation/axa-voyage-result";

type Company = "askia" | "axa";

/**
 * Voyage flow with an insurer switch: Askia (live API) or AXA (static tariff
 * grid, multi-traveler). Auto and the other products keep their own flows.
 */
export function VoyageSimulation() {
  const [company, setCompany] = useState<Company>("askia");
  const [quote, setQuote] = useState<AxaVoyageQuote | null>(null);

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
          <Label className="shrink-0">Compagnie</Label>
          <Select
            value={company}
            onValueChange={(v) => {
              setCompany(v as Company);
              setQuote(null);
            }}
          >
            <SelectTrigger className="sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="askia">Askia Assurances (en ligne)</SelectItem>
              <SelectItem value="axa">AXA Sénégal (grille)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {company === "askia"
              ? "Tarif calculé via l'API Askia"
              : "Tarif Schengen par barème AXA"}
          </p>
        </CardContent>
      </Card>

      {company === "askia" ? (
        <AskiaProductSimulation product="voyage" />
      ) : (
        <>
          <AxaVoyageForm onQuote={setQuote} />
          {quote && <AxaVoyageResult quote={quote} />}
        </>
      )}
    </div>
  );
}
