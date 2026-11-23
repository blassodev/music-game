import { readJson, spotifyPath, withLock, writeJson } from "./cache";
import { HitsterError } from "./errors";
import type { SpotifyTrack } from "./types";

/**
 * Credential-free Spotify metadata bridge.
 *
 * Hitster cards only give us a Spotify track id, so we scrape the public
 * track embed (`open.spotify.com/embed/track/{id}`) which contains a clean
 * JSON blob with the track name, artists, release date and duration. We fall
 * back to the oEmbed endpoint (title only) if the embed can't be parsed.
 *
 * Results are cached on disk to avoid re-scraping and to survive rate limits.
 */

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

async function fetchText(url: string, timeoutMs = 15000): Promise<string> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: { "user-agent": UA, "accept-language": "en" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

/** Decode an escaped JSON string fragment captured from raw HTML. */
function decodeJsonString(s: string): string {
  try {
    return JSON.parse(`"${s}"`) as string;
  } catch {
    return s;
  }
}

function parseEmbed(html: string, id: string): SpotifyTrack | null {
  const nameM = html.match(/"type":"track","name":"((?:[^"\\]|\\.)*)"/);
  if (!nameM) return null;
  const title = decodeJsonString(nameM[1]);

  const artists: string[] = [];
  const arrM = html.match(/"artists":\[(.*?)\]/);
  if (arrM) {
    const re = /"name":"((?:[^"\\]|\\.)*)"/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(arrM[1])) !== null) artists.push(decodeJsonString(m[1]));
  }

  const yearM = html.match(/"releaseDate":\{"isoString":"(\d{4})/);
  const durM = html.match(/"duration":(\d+)/);
  const expM = html.match(/"isExplicit":(true|false)/);

  return {
    id,
    title,
    artists,
    year: yearM ? Number(yearM[1]) : null,
    durationSec: durM ? Math.round(Number(durM[1]) / 1000) : null,
    explicit: expM ? expM[1] === "true" : false,
  };
}

async function fromOEmbed(id: string): Promise<SpotifyTrack | null> {
  try {
    const url = `https://open.spotify.com/oembed?url=${encodeURIComponent(
      `https://open.spotify.com/track/${id}`
    )}`;
    const j = JSON.parse(await fetchText(url)) as {
      title?: string;
      thumbnail_url?: string;
    };
    if (!j.title) return null;
    // oEmbed only gives the title; drop a trailing " | Spotify" just in case.
    const title = j.title.replace(/\s*\|\s*Spotify\s*$/i, "").trim();
    return {
      id,
      title,
      artists: [],
      year: null,
      durationSec: null,
      explicit: false,
    };
  } catch {
    return null;
  }
}

/** Get Spotify track metadata for an id, using (and populating) the disk cache. */
export async function getSpotifyTrack(id: string): Promise<SpotifyTrack> {
  const clean = (id || "").trim();
  if (!clean) throw new HitsterError("spotify_unavailable", "Empty Spotify id");

  const cached = await readJson<SpotifyTrack>(spotifyPath(clean));
  if (cached && cached.title) return cached;

  return withLock(`hitster:spotify:${clean}`, async () => {
    const cached2 = await readJson<SpotifyTrack>(spotifyPath(clean));
    if (cached2 && cached2.title) return cached2;

    let track: SpotifyTrack | null = null;
    try {
      track = parseEmbed(
        await fetchText(`https://open.spotify.com/embed/track/${clean}`),
        clean
      );
    } catch {
      track = null;
    }

    if (!track || !track.title || track.artists.length === 0) {
      const fallback = await fromOEmbed(clean);
      if (fallback) {
        track = track
          ? { ...track, title: track.title || fallback.title }
          : fallback;
      }
    }

    if (!track || !track.title) {
      throw new HitsterError(
        "spotify_unavailable",
        "Could not read Spotify metadata",
        clean
      );
    }

    await writeJson(spotifyPath(clean), track);
    return track;
  });
}
