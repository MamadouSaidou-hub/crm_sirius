"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  quoteAskiaProduct,
  type AskiaProduct,
  type ProductRisk,
} from "@/lib/insurers/askia-client";
import type { AskiaPricing } from "@/lib/insurers/askia";
import { MrhForm } from "@/components/simulation/mrh-form";
import { VoyageForm } from "@/components/simulation/voyage-form";
import { RapatriementForm } from "@/components/simulation/rapatriement-form";
import { PricingResult } from "@/components/simulation/pricing-result";

interface AskiaProductSimulationProps {
  product: AskiaProduct;
}

/**
 * Askia-only simulation flow for the non-auto products (MRH, voyage,
 * rapatriement): product form → Askia proxy → single pricing result.
 */
export function AskiaProductSimulation({
  product,
}: AskiaProductSimulationProps) {
  const [pricing, setPricing] = useState<AskiaPricing | null>(null);
  const [live, setLive] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSimulate = async (risk: ProductRisk) => {
    setLoading(true);
    setPricing(null);
    const quote = await quoteAskiaProduct(product, risk);
    setPricing(quote.pricing);
    setLive(quote.live);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {product === "mrh" && <MrhForm onSimulate={handleSimulate} />}
      {product === "voyage" && <VoyageForm onSimulate={handleSimulate} />}
      {product === "rapatriement" && (
        <RapatriementForm onSimulate={handleSimulate} />
      )}

      {loading && (
        <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card py-10 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Calcul du tarif Askia…
        </div>
      )}

      {!loading && pricing && (
        <PricingResult
          insurerName="Askia Assurances"
          pricing={pricing}
          live={live}
        />
      )}
    </div>
  );
}
