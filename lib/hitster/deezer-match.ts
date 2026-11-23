import { HitsterError } from "./errors";
import {
  clamp,
  levenshteinRatio,
  normalize,
  stripVersion,
  tokenJaccard,
} from "./text";
import type { DeezerMatch, SpotifyTrack } from "./types";

/**
 * Deezer candidate search + ranking.
 *
 * Given the metadata scraped from Spotify we run a free-text Deezer search and
 * score every candidate. Duration proximity is a strong discriminator between
 * the original and remixes/edits of the same title; artist + title similarity
 * and popularity break the rest, and karaoke/tribute releases are penalized.
 */

const DEEZER_API = "https://api.deezer.com";
const UA = "Mozilla/5.0 (compatible; music-game/1.0)";

const BLACKLIST = [
  "karaoke",
  "tribute",
  "made popular by",
  "in the style of",
  "originally performed",
  "instahit",
  "party hit",
  "studio all stars",
  "vocal version",
  "karaoke version",
  "tribute band",
  "cover version",
];

interface DeezerRawTrack {
  id: number;
  title?: string;
  title_short?: string;
  title_version?: string;
  duration?: number;
  rank?: number;
  isrc?: string;
  preview?: string;
  explicit_lyrics?: boolean;
  artist?: { id?: number; name?: string };
  album?: {
    id?: number;
    title?: string;
    cover?: string;
    cover_small?: string;
    cover_medium?: string;
    cover_big?: string;
    cover_xl?: string;
    release_date?: string;
  };
}

function mapTrack(r: DeezerRawTrack): DeezerMatch {
  const album = r.album || {};
  const artist = r.artist || {};
  const version = r.title_version ? ` ${r.title_version}` : "";
  return {
    deezerId: String(r.id),
    title: `${r.title || r.title_short || ""}${version}`.trim(),
    artist: artist.name || "",
    album: album.title || "",
    albumId: String(album.id || ""),
    cover: album.cover_medium || album.cover || "",
    coverBig: album.cover_big || album.cover_medium || album.cover || "",
    coverXl: album.cover_xl || "",
    duration: r.duration || 0,
    year: album.release_date ? String(album.release_date).slice(0, 4) : "0",
    preview: r.preview || "",
    explicit: !!r.explicit_lyrics,
    isrc: r.isrc,
    rank: r.rank,
  };
}

function scoreCandidate(r: DeezerRawTrack, sp: SpotifyTrack): number {
  const candArtist = r.artist?.name || "";
  const candTitle = `${r.title || r.title_short || ""} ${
    r.title_version || ""
  }`.trim();
  const candText = normalize(`${candArtist} ${candTitle}`);

  // Artist match against any credited Spotify artist (remixes credit several).
  let artistScore = 0;
  const na = normalize(candArtist);
  for (const raw of sp.artists || []) {
    const sa = normalize(raw);
    if (!sa) continue;
    if (na && na === sa) artistScore = Math.max(artistScore, 1);
    else if (na && (na.includes(sa) || sa.includes(na)))
      artistScore = Math.max(artistScore, 0.8);
  }

  // Title similarity (full + version-stripped).
  const srcTitle = sp.title || "";
  const titleSim = Math.max(
    tokenJaccard(candTitle, srcTitle),
    levenshteinRatio(candTitle, srcTitle),
    tokenJaccard(stripVersion(candTitle), stripVersion(srcTitle))
  );

  // Duration proximity distinguishes original vs remix/edit.
  let durScore = 0.4;
  if (sp.durationSec && r.duration) {
    durScore = clamp(1 - Math.abs(r.duration - sp.durationSec) / 30);
  }

  const popScore = clamp((r.rank || 0) / 700000);

  let penalty = 0;
  for (const bad of BLACKLIST) {
    if (candText.includes(normalize(bad))) {
      penalty = 1.2;
      break;
    }
  }

  return (
    1.6 * artistScore + 1.4 * titleSim + 1.2 * durScore + 0.3 * popScore - penalty
  );
}

async function deezerSearch(
  query: string,
  limit = 25
): Promise<DeezerRawTrack[]> {
  const url = `${DEEZER_API}/search?q=${encodeURIComponent(
    query
  )}&limit=${limit}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15000);
  try {
    const res = await fetch(url, {
      cache: "no-store",
      signal: ctrl.signal,
      headers: { "user-agent": UA },
    });
    if (!res.ok) throw new Error(`Deezer search HTTP ${res.status}`);
    const j = (await res.json()) as { data?: DeezerRawTrack[] };
    return Array.isArray(j.data) ? j.data : [];
  } finally {
    clearTimeout(timer);
  }
}

export interface DeezerMatchResult {
  best: DeezerMatch;
  alternates: DeezerMatch[];
}

/** Search Deezer and return the best-matching track for the Spotify metadata. */
export async function matchDeezerTrack(
  sp: SpotifyTrack
): Promise<DeezerMatchResult> {
  const primary = (sp.artists && sp.artists[0]) || "";
  const query = `${primary} ${sp.title}`.replace(/\s+/g, " ").trim();
  if (!query) {
    throw new HitsterError("no_match", "Nothing to search on Deezer", sp.id);
  }

  const results = await deezerSearch(query);
  if (results.length === 0) {
    throw new HitsterError("no_match", "No Deezer results", query);
  }

  const scored = results
    .map((r) => ({ track: mapTrack(r), score: scoreCandidate(r, sp) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];
  best.track.score = best.score;

  const alternates = scored.slice(1, 4).map((s) => {
    s.track.score = s.score;
    return s.track;
  });

  return { best: best.track, alternates };
}
