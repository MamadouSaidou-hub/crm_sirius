import type {
  MrhRiskData,
  RapatriementRiskData,
  VoyageRiskData,
} from "@/lib/types";
import type { AskiaPricing } from "@/lib/insurers/askia";

/** Risk payloads for the non-auto Askia products. */
export type ProductRisk = MrhRiskData | VoyageRiskData | RapatriementRiskData;
export type AskiaProduct = "mrh" | "voyage" | "rapatriement";

export interface ProductQuote {
  pricing: AskiaPricing;
  /** True when priced by the live Askia API, false when locally estimated. */
  live: boolean;
}

/** Assemble a pricing breakdown from a net premium (mirrors Askia's shape). */
function estimate(net: number): AskiaPricing {
  const netPremium = Math.round(net / 100) * 100;
  const taxes = Math.round((netPremium * 0.14) / 100) * 100;
  const fees = 2500;
  return {
    netPremium,
    taxes,
    fees,
    totalPremium: netPremium + taxes + fees,
    commission: Math.round(netPremium * 0.1),
  };
}

/** Local fallback pricing when the Askia API isn't configured/reachable. */
function mockPricing(product: AskiaProduct, risk: ProductRisk): AskiaPricing {
  if (product === "mrh") {
    const r = risk as MrhRiskData;
    return estimate(
      r.contentsValue * 0.004 + r.rooms * 2_500 + (r.durationMonths / 12) * 5_000,
    );
  }
  if (product === "voyage") {
    const r = risk as VoyageRiskData;
    return estimate(r.durationDays * 1_200 + 10_000);
  }
  const r = risk as RapatriementRiskData;
  const base = r.formula === "02" ? 45_000 : 25_000;
  return estimate(
    base + r.extraAdults * 8_000 + r.extraChildren * 5_000 + r.seniors * 12_000,
  );
}

/**
 * Price a non-auto product through the Askia proxy, falling back to a local
 * estimate when the API key isn't set or the call fails.
 */
export async function quoteAskiaProduct(
  product: AskiaProduct,
  risk: ProductRisk,
): Promise<ProductQuote> {
  try {
    const res = await fetch("/api/insurers/askia/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ product, risk }),
    });
    const data = await res.json();
    if (res.ok && data.ok && data.pricing) {
      return { pricing: data.pricing as AskiaPricing, live: true };
    }
  } catch {
    // ignore — fall back to a local estimate
  }
  return { pricing: mockPricing(product, risk), live: false };
}
