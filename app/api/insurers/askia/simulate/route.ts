import { NextResponse } from "next/server";
import type { AutoRiskData, SimProduct } from "@/lib/types";
import {
  buildAskiaAutoParams,
  buildAskiaMrhParams,
  buildAskiaPackParams,
  buildAskiaRapatriementParams,
  buildAskiaVoyageParams,
  mapAskiaResponse,
} from "@/lib/insurers/askia";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  risk: any,
): { path: string; params: Record<string, string> } | null {
  switch (product) {
    case "auto": {
      const auto = risk as AutoRiskData;
      const usePack = Boolean(auto.packCode);
      return {
        path: usePack ? "srwb/autopack" : "srwb/automobile",
        params: usePack
          ? buildAskiaPackParams(auto)
          : buildAskiaAutoParams(auto),
      };
    }
    case "mrh":
      return { path: "srwb/mrh", params: buildAskiaMrhParams(risk) };
    case "voyage":
      return { path: "srwb/voyage", params: buildAskiaVoyageParams(risk) };
    case "rapatriement":
      return {
        path: "srwb/rapatriement",
        params: buildAskiaRapatriementParams(risk),
      };
    default:
      return null;
  }
}

export async function POST(request: Request) {
  const appClient = process.env.ASKIA_APP_CLIENT;
  if (!appClient) {
    return NextResponse.json({ ok: false, reason: "not_configured" });
  }

  let body: { product?: SimProduct; risk?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, reason: "bad_request" },
      { status: 400 },
    );
  }

  const product = body.product ?? "auto";
  const target = endpointFor(product, body.risk);
  if (!target) {
    return NextResponse.json(
      { ok: false, reason: "unknown_product" },
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
    return NextResponse.json({ ok: true, pricing: mapAskiaResponse(raw) });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "upstream_unreachable" },
      { status: 502 },
    );
  }
}
