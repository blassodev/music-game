import { NextRequest, NextResponse } from "next/server";
import { ensureTrackAudio } from "@/lib/hitster/download";
import { statusForCode, toErrorCode } from "@/lib/hitster/errors";
import { resolveHitsterCard } from "@/lib/hitster/resolve";
import { streamFile } from "@/lib/hitster/stream-file";

export const runtime = "nodejs";
// On-the-fly downloads can be slow the first time (self-hosted; not Vercel).
export const maxDuration = 300;

/**
 * GET /api/hitster/stream?sku=aaaa0064&card=00281
 * -> resolves the card (cached), downloads the Deezer track on demand to a temp
 *    cache (never PocketBase) and streams it back with HTTP Range support.
 *
 * The endpoint only accepts sku+card and resolves internally, so it can't be
 * used to fetch arbitrary Deezer tracks.
 */
export async function GET(req: NextRequest) {
  const sku = req.nextUrl.searchParams.get("sku") || "";
  const card = req.nextUrl.searchParams.get("card") || "";

  try {
    const resolved = await resolveHitsterCard(sku, card);
    const file = await ensureTrackAudio(resolved.deezerId);
    return await streamFile(file.path, file.mime, req.headers.get("range"));
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
