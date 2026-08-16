import { NextResponse } from "next/server";
import { z } from "zod";
import type { AutoRiskData, SimProduct } from "@/lib/types";
import {
  buildAskiaAutoParams,
  buildAskiaMrhParams,
  buildAskiaPackParams,
  buildAskiaRapatriementParams,
  buildAskiaVoyageParams,
  mapAskiaResponse,
} from "@/lib/insurers/askia";

// Strict schema validation for each product's risk data
const AutoRiskSchema = z.object({
  category: z.string().min(1),
  subCategory: z.string().min(1),
  packCode: z.string().optional(),
  guarantees: z.record(z.boolean()).optional(),
});

const MrhRiskSchema = z.object({
  contentsValue: z.number().positive(),
  rooms: z.number().int().min(1),
  durationMonths: z.number().int().positive(),
});

const VoyageRiskSchema = z.object({
  zone: z.string().min(1),
  durationDays: z.number().int().positive(),
});

const RapatriementRiskSchema = z.object({
  formula: z.string().min(1),
  extraAdults: z.number().int().nonnegative(),
  extraChildren: z.number().int().nonnegative(),
  seniors: z.number().int().nonnegative(),
});

const RequestSchema = z.object({
  product: z.enum(["auto", "mrh", "voyage", "rapatriement"]).default("auto"),
  risk: z.unknown().refine((val) => val !== undefined && val !== null, {
    message: "risk data is required",
  }),
});

/**
 * Server-side proxy for the Askia tarif API across products (auto, mrh, voyage,
 * rapatriement). Runs on the server so the `appClient` key never reaches the
 * browser and no CORS applies. Config: ASKIA_APP_CLIENT, ASKIA_API_BASE.
 *
 * Body: { product: SimProduct, risk: <product risk> }
 * Responds `{ ok: false }` when not configured / on failure so the client falls
 * back to a local estimate.
 */
function endpointFor(
  product: SimProduct,
  risk: unknown,
): { path: string; params: Record<string, string> } | null {
  try {
    switch (product) {
      case "auto": {
        const auto = AutoRiskSchema.parse(risk);
        const usePack = Boolean(auto.packCode);
        return {
          path: usePack ? "srwb/autopack" : "srwb/automobile",
          params: usePack
            ? buildAskiaPackParams(auto as AutoRiskData)
            : buildAskiaAutoParams(auto as AutoRiskData),
        };
      }
      case "mrh": {
        const mrh = MrhRiskSchema.parse(risk);
        return {
          path: "srwb/mrh",
          params: buildAskiaMrhParams(mrh as unknown as import("@/lib/types").MrhRiskData),
        };
      }
      case "voyage": {
        const voyage = VoyageRiskSchema.parse(risk);
        return {
          path: "srwb/voyage",
          params: buildAskiaVoyageParams(voyage as unknown as import("@/lib/types").VoyageRiskData),
        };
      }
      case "rapatriement": {
        const rapatriement = RapatriementRiskSchema.parse(risk);
        return {
          path: "srwb/rapatriement",
          params: buildAskiaRapatriementParams(
            rapatriement as unknown as import("@/lib/types").RapatriementRiskData,
          ),
        };
      }
      default:
        return null;
    }
  } catch {
    // Validation failed; return null to trigger fallback
    return null;
  }
}

export async function POST(request: Request) {
  const appClient = process.env.ASKIA_APP_CLIENT;
  if (!appClient) {
    return NextResponse.json({ ok: false, reason: "not_configured" });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad_request" },
      { status: 400 },
    );
  }

  // Validate request schema
  const parsed = RequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, reason: "invalid_request" },
      { status: 400 },
    );
  }

  const { product, risk } = parsed.data;
  const target = endpointFor(product, risk);
  if (!target) {
    return NextResponse.json(
      { ok: false, reason: "invalid_risk_data" },
      { status: 400 },
    );
  }

  const base = process.env.ASKIA_API_BASE ?? "https://api.askianet.com";
  const params = new URLSearchParams(target.params);
  const url = `${base}/webservice/${target.path}?${params.toString()}`;

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json", appClient },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, reason: `upstream_${upstream.status}` },
        { status: 502 },
      );
    }
    const raw = await upstream.json();
    const response = NextResponse.json({
      ok: true,
      pricing: mapAskiaResponse(raw),
    });
    // Restrict CORS to same-origin only (internal tool)
    response.headers.set("Access-Control-Allow-Origin", "same-origin");
    response.headers.set("Access-Control-Allow-Methods", "POST");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    return response;
  } catch {
    return NextResponse.json(
      { ok: false, reason: "upstream_unreachable" },
      { status: 502 },
    );
  }
}
