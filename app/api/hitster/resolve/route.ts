import { NextRequest, NextResponse } from "next/server";
import { statusForCode, toErrorCode } from "@/lib/hitster/errors";
import { resolveHitsterCard } from "@/lib/hitster/resolve";

export const runtime = "nodejs";

/**
 * GET /api/hitster/resolve?sku=aaaa0064&card=00281[&lang=de]
 * -> resolved metadata (Spotify + Deezer) for a Hitster card. No download here.
 */
export async function GET(req: NextRequest) {
  const sku = req.nextUrl.searchParams.get("sku") || "";
  const card = req.nextUrl.searchParams.get("card") || "";
  const lang = req.nextUrl.searchParams.get("lang") || undefined;

  try {
    const data = await resolveHitsterCard(sku, card, lang);
    return NextResponse.json({ ok: true, ...data });
  } catch (err) {
    const code = toErrorCode(err);
    return NextResponse.json(
      {
        ok: false,
        error: code,
        details: err instanceof Error ? err.message : String(err),
      },
      { status: statusForCode(code) }
    );
  }
}
