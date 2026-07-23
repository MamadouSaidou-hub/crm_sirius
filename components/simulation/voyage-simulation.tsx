"use client";

import { useState } from "react";
import type { AxaVoyageQuote } from "@/lib/insurers/axa-voyage";
import type { NsiaVoyageQuote } from "@/lib/insurers/nsia-voyage";
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
import { NsiaVoyageForm } from "@/components/simulation/nsia-voyage-form";
import { NsiaVoyageResult } from "@/components/simulation/nsia-voyage-result";

type Company = "askia" | "axa" | "nsia";

/**
 * Voyage flow with an insurer switch: Askia (live API) or AXA (static tariff
 * grid, multi-traveler). Auto and the other products keep their own flows.
 */
const COMPANY_HINT: Record<Company, string> = {
  askia: "Tarif calculé via l'API Askia",
  axa: "Tarif Schengen par barème AXA",
  nsia: "Tarif par barème NSIA (âge appliqué)",
};

export function VoyageSimulation() {
  const [company, setCompany] = useState<Company>("askia");
  const [axaQuote, setAxaQuote] = useState<AxaVoyageQuote | null>(null);
  const [nsiaQuote, setNsiaQuote] = useState<NsiaVoyageQuote | null>(null);

  const resetQuotes = () => {
    setAxaQuote(null);
    setNsiaQuote(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-4">
          <Label className="shrink-0">Compagnie</Label>
          <Select
            value={company}
            onValueChange={(v) => {
              setCompany(v as Company);
              resetQuotes();
            }}
          >
            <SelectTrigger className="sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="askia">Askia Assurances (en ligne)</SelectItem>
              <SelectItem value="axa">AXA Sénégal (grille)</SelectItem>
              <SelectItem value="nsia">NSIA Sénégal (grille)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground sm:ml-auto">
            {COMPANY_HINT[company]}
          </p>
        </CardContent>
      </Card>

      {company === "askia" && <AskiaProductSimulation product="voyage" />}

      {company === "axa" && (
        <>
          <AxaVoyageForm onQuote={setAxaQuote} />
          {axaQuote && <AxaVoyageResult quote={axaQuote} />}
        </>
      )}

      {company === "nsia" && (
        <>
          <NsiaVoyageForm onQuote={setNsiaQuote} />
          {nsiaQuote && <NsiaVoyageResult quote={nsiaQuote} />}
        </>
      )}
    </div>
  );
}
