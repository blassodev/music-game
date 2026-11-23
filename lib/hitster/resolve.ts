import { metaPath, readJson, withLock, writeJson } from "./cache";
import { matchDeezerTrack } from "./deezer-match";
import { HitsterError } from "./errors";
import { lookupCard } from "./gameset-db";
import { cardToInt, isValidCard, isValidSku } from "./parse";
import { getSpotifyTrack } from "./spotify-bridge";
import type { ResolvedHitster } from "./types";

/**
 * Orchestrator: Hitster `sku` + `card` -> everything the player needs.
 *
 *   sku+card --(gameset_database.json)--> Spotify id
 *            --(Spotify embed scrape)----> title/artists/duration/year
 *            --(Deezer search + ranking)-> chosen Deezer track + metadata
 *
 * The result is cached on disk (keyed by sku+card) so repeat scans are instant
 * and we don't hammer Spotify/Deezer. No PocketBase involved.
 */

export async function resolveHitsterCard(
  skuRaw: string,
  cardRaw: string,
  lang?: string
): Promise<ResolvedHitster> {
  const sku = (skuRaw || "").trim().toLowerCase();
  const card = (cardRaw || "").trim();

  if (!isValidSku(sku) || !isValidCard(card)) {
    throw new HitsterError("invalid_code", "sku/card inválidos", `${sku}/${card}`);
  }

  const cardInt = cardToInt(card);
  const cacheFile = metaPath(sku, cardInt);

  const cached = await readJson<ResolvedHitster>(cacheFile);
  if (cached && cached.deezerId) {
    return lang ? { ...cached, lang } : cached;
  }

  return withLock(`hitster:resolve:${sku}_${cardInt}`, async () => {
    const cached2 = await readJson<ResolvedHitster>(cacheFile);
    if (cached2 && cached2.deezerId) {
      return lang ? { ...cached2, lang } : cached2;
    }

    const found = await lookupCard(sku, card);
    if (!found) {
      throw new HitsterError(
        "card_not_found",
        "Carta no encontrada en la base de datos de Hitster",
        `${sku}/${card}`
      );
    }

    const sp = await getSpotifyTrack(found.spotify);
    const { best, alternates } = await matchDeezerTrack(sp);

    const resolved: ResolvedHitster = {
      sku,
      card,
      lang,
      cardNumber: found.cardNumber,
      gamesetName: found.name,
      gamesetLanguage: found.language,
      spotifyId: found.spotify,
      deezerId: best.deezerId,
      // Prefer the Spotify (canonical card) text; fall back to Deezer's.
      title: sp.title || best.title,
      artist: (sp.artists && sp.artists[0]) || best.artist,
      album: best.album,
      cover: best.cover,
      coverBig: best.coverBig,
      duration: sp.durationSec || best.duration,
      year: sp.year ? String(sp.year) : best.year,
      explicit: sp.explicit || best.explicit,
      preview: best.preview,
      confidence: best.score,
      alternates: alternates.map((a) => ({
        deezerId: a.deezerId,
        title: a.title,
        artist: a.artist,
      })),
    };

    await writeJson(cacheFile, resolved);
    return resolved;
  });
}
