/**
 * Shared data shapes for the Hitster integration.
 *
 * This module must stay free of server-only imports (fs / child_process) so it
 * can be imported as a *type* from client components without leaking Node code
 * into the browser bundle.
 */

/** A parsed Hitster QR code: `.../{lang}/{sku}/{card}`. */
export interface HitsterCode {
  /** ISO-ish language segment from the QR (informational only). */
  lang: string;
  /** Game set SKU, e.g. `aaaa0064`. */
  sku: string;
  /** Card number as it appears in the URL, e.g. `00281`. */
  card: string;
}

/** Track metadata scraped from Spotify (no credentials required). */
export interface SpotifyTrack {
  id: string;
  title: string;
  artists: string[];
  /** Release year parsed from the embed, when available. */
  year: number | null;
  /** Duration in seconds parsed from the embed, when available. */
  durationSec: number | null;
  explicit: boolean;
}

/** A candidate (or chosen) track coming from the Deezer search API. */
export interface DeezerMatch {
  deezerId: string;
  title: string;
  artist: string;
  album: string;
  albumId: string;
  cover: string;
  coverBig: string;
  coverXl: string;
  duration: number;
  year: string;
  preview: string;
  explicit: boolean;
  isrc?: string;
  rank?: number;
  /** Ranking score, only set on resolved matches. */
  score?: number;
}

/** The fully resolved card: everything the player needs to render + stream. */
export interface ResolvedHitster {
  sku: string;
  card: string;
  lang?: string;
  cardNumber: string;
  gamesetName?: string;
  gamesetLanguage?: string;
  spotifyId: string;
  deezerId: string;
  title: string;
  artist: string;
  album: string;
  cover: string;
  coverBig: string;
  duration: number;
  year: string;
  explicit: boolean;
  preview?: string;
  /** Ranking score of the chosen Deezer candidate (higher = more confident). */
  confidence?: number;
  /** Runner-up candidates, kept for debugging / a future "confirm" UI. */
  alternates?: { deezerId: string; title: string; artist: string }[];
}
