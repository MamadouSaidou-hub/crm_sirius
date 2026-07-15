import { NextResponse } from "next/server";
import type { AskiaRefItem } from "@/lib/insurers/askia";

/**
 * Server-side proxy for the Askia referential endpoints (categories,
 * sub-categories, commercial packs). Holds the `appClient` key server-side.
 *
 * Query params:
 *   type   = "categories" | "scategories" | "packs"
 *   brCode = branch code (categories; auto = 500)
 *   catCode = category code (scategories)
 *
 * Responds `{ ok: false }` when not configured or on failure so the client can
 * fall back to the documented static lists.
 */
export async function GET(request: Request) {
  const appClient = process.env.ASKIA_APP_CLIENT;
  if (!appClient) {
    return NextResponse.json({ ok: false, reason: "not_configured" });
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");
  const base = process.env.ASKIA_API_BASE ?? "https://api.askianet.com";

  let path: string | null = null;
  if (type === "categories") {
    const brCode = searchParams.get("brCode") ?? "500";
    path = `/webservice/referentiel/categories?brCode=${encodeURIComponent(brCode)}`;
  } else if (type === "scategories") {
    const catCode = searchParams.get("catCode");
    if (!catCode) {
      return NextResponse.json(
        { ok: false, reason: "missing_catCode" },
        { status: 400 },
      );
    }
    path = `/webservice/referentiel/scategories?catCode=${encodeURIComponent(catCode)}`;
  } else if (type === "packs") {
    path = `/webservice/referentiel/packs`;
  } else {
    return NextResponse.json(
      { ok: false, reason: "bad_type" },
      { status: 400 },
    );
  }

  try {
    const upstream = await fetch(`${base}${path}`, {
      headers: { Accept: "application/json", appClient },
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, reason: `upstream_${upstream.status}` },
        { status: 502 },
      );
    }
    const items = (await upstream.json()) as AskiaRefItem[];
    return NextResponse.json({ ok: true, items });
  } catch {
    return NextResponse.json(
      { ok: false, reason: "upstream_unreachable" },
      { status: 502 },
    );
  }
}
