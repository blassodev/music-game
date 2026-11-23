import { promises as fs } from "fs";
import {
  cacheRoot,
  gamesetSnapshotPath,
  readJson,
  withLock,
} from "./cache";

/**
 * Loader for Hitster's public `gameset_database.json`.
 *
 * The file is ~3.7 MB and maps `sku -> cards -> { CardNumber, Spotify }`.
 * We fetch it once, keep an in-memory index (TTL), persist a snapshot on disk
 * and fall back to that snapshot (or stale memory) if Hitster is unreachable.
 */

const DB_URL =
  process.env.HITSTER_DB_URL ||
  "https://hitster.jumboplay.com/hitster-assets/gameset_database.json";

const MEM_TTL_MS = 6 * 60 * 60 * 1000; // 6h

interface RawCard {
  CardNumber: string;
  Spotify?: string;
  ArtistType?: string;
}
interface RawGameset {
  sku: string;
  gameset_data?: {
    gameset_language?: string;
    gameset_name?: string;
    cards?: RawCard[];
  };
}
interface RawDb {
  updated_on?: number;
  gamesets?: RawGameset[];
}

export interface CardEntry {
  spotify: string;
  cardNumber: string;
  name?: string;
  language?: string;
}

interface Index {
  updatedOn: number;
  size: number;
  byKey: Map<string, CardEntry>;
}

let mem: { at: number; index: Index } | null = null;

function buildIndex(json: RawDb): Index {
  const byKey = new Map<string, CardEntry>();
  for (const g of json.gamesets || []) {
    const sku = (g.sku || "").trim().toLowerCase();
    const gd = g.gameset_data;
    if (!sku || !gd || !Array.isArray(gd.cards)) continue;
    for (const c of gd.cards) {
      const n = parseInt(c.CardNumber, 10);
      if (!c.Spotify || Number.isNaN(n)) continue;
      byKey.set(`${sku}#${n}`, {
        spotify: c.Spotify,
        cardNumber: c.CardNumber,
        name: gd.gameset_name,
        language: gd.gameset_language,
      });
    }
  }
  return { updatedOn: json.updated_on || 0, size: byKey.size, byKey };
}

async function fetchRemote(): Promise<RawDb> {
  const res = await fetch(DB_URL, {
    cache: "no-store",
    headers: { "user-agent": "Mozilla/5.0 (compatible; music-game/1.0)" },
  });
  if (!res.ok) throw new Error(`gameset_database HTTP ${res.status}`);
  return (await res.json()) as RawDb;
}

async function persistSnapshot(json: RawDb): Promise<void> {
  try {
    await fs.mkdir(cacheRoot(), { recursive: true });
    await fs.writeFile(gamesetSnapshotPath(), JSON.stringify(json), "utf8");
  } catch {
    // best-effort
  }
}

async function loadIndex(): Promise<Index> {
  if (mem && Date.now() - mem.at < MEM_TTL_MS) return mem.index;

  return withLock("hitster:gameset-db", async () => {
    // Re-check after acquiring the lock.
    if (mem && Date.now() - mem.at < MEM_TTL_MS) return mem.index;

    try {
      const json = await fetchRemote();
      const index = buildIndex(json);
      mem = { at: Date.now(), index };
      void persistSnapshot(json);
      return index;
    } catch (err) {
      // 1) disk snapshot, 2) stale memory, 3) give up
      const snap = await readJson<RawDb>(gamesetSnapshotPath());
      if (snap && Array.isArray(snap.gamesets)) {
        const index = buildIndex(snap);
        mem = { at: Date.now(), index };
        return index;
      }
      if (mem) return mem.index;
      throw err;
    }
  });
}

/**
 * Resolve a `sku` + card number to its Spotify track id (plus gameset info),
 * or `null` when the card is not present in the database.
 */
export async function lookupCard(
  sku: string,
  card: string
): Promise<CardEntry | null> {
  const index = await loadIndex();
  const n = parseInt(card, 10);
  if (Number.isNaN(n)) return null;
  return index.byKey.get(`${sku.trim().toLowerCase()}#${n}`) || null;
}

/** Diagnostics helper (used by the resolve endpoint / debugging). */
export async function gamesetDbStats(): Promise<{
  updatedOn: number;
  size: number;
  source: "memory" | "fresh";
}> {
  const index = await loadIndex();
  return {
    updatedOn: index.updatedOn,
    size: index.size,
    source: mem && Date.now() - mem.at < 1000 ? "memory" : "fresh",
  };
}
