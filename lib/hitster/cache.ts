import { promises as fs } from "fs";
import os from "os";
import path from "path";

/**
 * Ephemeral on-disk cache for the Hitster flow.
 *
 * Nothing here ever touches PocketBase: resolved metadata, scraped Spotify
 * info, a snapshot of the gameset database and the downloaded audio files all
 * live in a temp directory and are pruned by TTL/LRU.
 */

const META_DIR = "meta";
const AUDIO_DIR = "audio";
const SPOTIFY_DIR = "spotify";

export function cacheRoot(): string {
  return (
    process.env.HITSTER_CACHE_DIR || path.join(os.tmpdir(), "hitster-cache")
  );
}

export function metaDir(): string {
  return path.join(cacheRoot(), META_DIR);
}
export function audioDir(): string {
  return path.join(cacheRoot(), AUDIO_DIR);
}
export function spotifyDir(): string {
  return path.join(cacheRoot(), SPOTIFY_DIR);
}

export function metaPath(sku: string, cardInt: number): string {
  return path.join(metaDir(), `${sku}_${cardInt}.json`);
}
export function spotifyPath(id: string): string {
  return path.join(spotifyDir(), `${id}.json`);
}
export function gamesetSnapshotPath(): string {
  return path.join(cacheRoot(), "gameset_database.json");
}

export async function ensureDir(dir: string): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function readJson<T>(file: string): Promise<T | null> {
  try {
    const buf = await fs.readFile(file, "utf8");
    return JSON.parse(buf) as T;
  } catch {
    return null;
  }
}

export async function writeJson(file: string, data: unknown): Promise<void> {
  try {
    await ensureDir(path.dirname(file));
    await fs.writeFile(file, JSON.stringify(data), "utf8");
  } catch {
    // Best-effort cache; ignore write failures.
  }
}

/* ------------------------------------------------------------------ *
 * In-process locks: dedupe concurrent identical work (same card being
 * scanned twice, same track downloaded by two players, ...).
 * ------------------------------------------------------------------ */

const locks = new Map<string, Promise<unknown>>();

export function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = locks.get(key);
  if (existing) return existing as Promise<T>;
  const p = Promise.resolve()
    .then(fn)
    .finally(() => {
      locks.delete(key);
    });
  locks.set(key, p);
  return p;
}

/* ------------------------------------------------------------------ *
 * Best-effort TTL + LRU pruning of the audio directory (the only one
 * that grows meaningfully). Throttled to run at most once per hour.
 * ------------------------------------------------------------------ */

let lastPrune = 0;
const PRUNE_INTERVAL_MS = 60 * 60 * 1000;

function ttlMs(): number {
  const days = Number(process.env.HITSTER_CACHE_TTL_DAYS) || 7;
  return days * 24 * 60 * 60 * 1000;
}
function maxFiles(): number {
  return Number(process.env.HITSTER_CACHE_MAX_FILES) || 500;
}

export async function pruneIfNeeded(): Promise<void> {
  const now = Date.now();
  if (now - lastPrune < PRUNE_INTERVAL_MS) return;
  lastPrune = now;

  try {
    const dir = audioDir();
    const entries = await fs.readdir(dir);
    const files: { name: string; mtime: number; size: number }[] = [];
    for (const name of entries) {
      if (name.endsWith(".part")) continue;
      const full = path.join(dir, name);
      try {
        const st = await fs.stat(full);
        if (st.isFile()) files.push({ name: full, mtime: st.mtimeMs, size: st.size });
      } catch {
        // ignore
      }
    }

    const cutoff = now - ttlMs();
    const survivors = files.filter((f) => {
      if (f.mtime < cutoff) {
        fs.rm(f.name, { force: true }).catch(() => {});
        return false;
      }
      return true;
    });

    const limit = maxFiles();
    if (survivors.length > limit) {
      survivors.sort((a, b) => a.mtime - b.mtime); // oldest first
      const excess = survivors.length - limit;
      for (const f of survivors.slice(0, excess)) {
        fs.rm(f.name, { force: true }).catch(() => {});
      }
    }
  } catch {
    // Pruning is best-effort.
  }
}
