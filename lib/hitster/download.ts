import { execFile } from "child_process";
import { promises as fs } from "fs";
import { mkdtemp, readdir, rename, stat } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import { audioDir, ensureDir, pruneIfNeeded, withLock } from "./cache";
import { HitsterError } from "./errors";

/**
 * On-the-fly Deezer download ("en caliente") via streamrip, cached to a temp
 * directory. This NEVER writes to PocketBase — files live only on disk and are
 * pruned by TTL/LRU (see cache.ts).
 */

const execFileAsync = promisify(execFile);

const RIP_BIN = process.env.RIP_BIN || "rip";
const RIP_CONFIG = process.env.RIP_CONFIG_PATH || "/app/rip/config.toml";

export interface AudioFile {
  path: string;
  mime: string;
  ext: string;
  size: number;
}

const AUDIO_EXT_RE = /\.(mp3|flac|ogg|m4a|aac|opus)$/i;

function mimeFor(ext: string): string {
  switch (ext.toLowerCase()) {
    case ".flac":
      return "audio/flac";
    case ".ogg":
      return "audio/ogg";
    case ".opus":
      return "audio/opus";
    case ".m4a":
    case ".aac":
      return "audio/mp4";
    default:
      return "audio/mpeg";
  }
}

async function findAudioFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findAudioFiles(full)));
    } else if (AUDIO_EXT_RE.test(entry.name)) {
      out.push(full);
    }
  }
  return out.sort();
}

/** Find an already-cached audio file for a Deezer track id, if any. */
export async function findCachedAudio(
  deezerId: string
): Promise<AudioFile | null> {
  const dir = audioDir();
  try {
    const entries = await readdir(dir);
    const hit = entries.find(
      (e) =>
        e.startsWith(`${deezerId}.`) &&
        !e.endsWith(".part") &&
        !e.endsWith(".json")
    );
    if (!hit) return null;
    const full = path.join(dir, hit);
    const st = await stat(full);
    if (!st.isFile() || st.size === 0) return null;
    const ext = path.extname(hit).toLowerCase() || ".mp3";
    return { path: full, mime: mimeFor(ext), ext, size: st.size };
  } catch {
    return null;
  }
}

async function downloadToCache(deezerId: string): Promise<AudioFile> {
  const tmp = await mkdtemp(path.join(tmpdir(), "hitster-rip-"));
  try {
    await execFileAsync(
      RIP_BIN,
      [
        "--config-path",
        RIP_CONFIG,
        "-q",
        "0", // MP3 128 kbps (free account)
        "-ndb",
        "--no-progress",
        "-f",
        tmp,
        "url",
        `https://www.deezer.com/track/${deezerId}`,
      ],
      { timeout: 280000, maxBuffer: 8 * 1024 * 1024 }
    );

    const files = await findAudioFiles(tmp);
    if (files.length === 0) {
      throw new HitsterError(
        "download_failed",
        "streamrip produced no audio file",
        deezerId
      );
    }

    const src = files[0];
    const ext = path.extname(src).toLowerCase() || ".mp3";
    const dir = await ensureDir(audioDir());
    // turbopackIgnore: the cache dir is env-configurable (defaults to os.tmpdir()),
    // so it can't be statically proven to live outside the project. This is an
    // intentional runtime path, not a bundle dependency.
    const dest = path.join(/* turbopackIgnore: true */ dir, `${deezerId}${ext}`);
    const part = `${dest}.part`;

    // copy (handles cross-device) then atomic rename within the cache dir
    await fs.copyFile(src, part);
    await rename(part, dest);

    const st = await stat(/* turbopackIgnore: true */ dest);
    return { path: dest, mime: mimeFor(ext), ext, size: st.size };
  } catch (err) {
    if (err instanceof HitsterError) throw err;
    const raw = err as { stderr?: string; message?: string };
    const details = String(raw.stderr || raw.message || "").slice(-400);
    throw new HitsterError(
      "download_failed",
      "Error al descargar de Deezer",
      details
    );
  } finally {
    await fs.rm(tmp, { recursive: true, force: true }).catch(() => {});
  }
}

/** Return a cached audio file for the track, downloading it on demand. */
export async function ensureTrackAudio(deezerId: string): Promise<AudioFile> {
  const cached = await findCachedAudio(deezerId);
  if (cached) return cached;

  return withLock(`hitster:dl:${deezerId}`, async () => {
    const again = await findCachedAudio(deezerId);
    if (again) return again;
    const file = await downloadToCache(deezerId);
    void pruneIfNeeded();
    return file;
  });
}
