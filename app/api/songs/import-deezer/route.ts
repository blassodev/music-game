import { NextRequest, NextResponse } from "next/server";
import PocketBase from "pocketbase";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, readdir, readFile, rm } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

// Descargas largas permitidas (self-hosted; no aplica en Vercel)
export const maxDuration = 300;

const execFileAsync = promisify(execFile);
const RIP_CONFIG = "/app/rip/config.toml";

async function findAudioFiles(dir: string): Promise<string[]> {
  const out: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await findAudioFiles(full)));
    } else if (/\.(mp3|flac|ogg|m4a|aac|opus)$/i.test(entry.name)) {
      out.push(full);
    }
  }
  return out.sort();
}

async function probeTags(file: string): Promise<Record<string, string>> {
  try {
    const { stdout } = await execFileAsync("ffprobe", [
      "-v",
      "quiet",
      "-print_format",
      "json",
      "-show_entries",
      "format_tags",
      file,
    ]);
    const tags = JSON.parse(stdout)?.format?.tags ?? {};
    const norm: Record<string, string> = {};
    for (const [key, value] of Object.entries(tags)) {
      norm[key.toLowerCase()] = String(value);
    }
    return norm;
  } catch {
    return {};
  }
}

export async function POST(request: NextRequest) {
  // Reutilizamos el token de PocketBase del usuario logueado
  const token = request.headers.get("x-pb-token") || "";
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  let url: string;
  try {
    const body = await request.json();
    url = String(body.url || "").trim();
  } catch {
    return NextResponse.json({ error: "URL requerida" }, { status: 400 });
  }

  if (!/(www\.)?deezer\.com|deezer\.page\.link/i.test(url)) {
    return NextResponse.json(
      { error: "URL de Deezer no válida" },
      { status: 400 }
    );
  }

  const tmp = await mkdtemp(path.join(tmpdir(), "rip-"));

  // Descargar con streamrip (quality 0 = MP3 128 kbps; la cuenta es gratuita)
  try {
    await execFileAsync(
      "rip",
      [
        "--config-path",
        RIP_CONFIG,
        "-q",
        "0",
        "-ndb",
        "--no-progress",
        "-f",
        tmp,
        "url",
        url,
      ],
      { timeout: 280000, maxBuffer: 8 * 1024 * 1024 }
    );
  } catch (err) {
    await rm(tmp, { recursive: true, force: true });
    const raw = err as { stderr?: string; message?: string };
    const details = String(raw.stderr || raw.message || "").slice(-400);
    console.error("streamrip error:", details);
    return NextResponse.json(
      { error: "Error al descargar de Deezer", details },
      { status: 502 }
    );
  }

  const files = await findAudioFiles(tmp);
  if (files.length === 0) {
    await rm(tmp, { recursive: true, force: true });
    return NextResponse.json(
      { error: "No se descargó ningún archivo de audio" },
      { status: 502 }
    );
  }

  const pb = new PocketBase(
    process.env.POCKETBASE_INTERNAL_URL ||
      process.env.NEXT_PUBLIC_POCKETBASE_URL ||
      "https://pb-musica.blassanto.me"
  );
  pb.autoCancellation(false);
  pb.authStore.save(token, null as never);

  const songs: Array<Record<string, string>> = [];
  const failed: string[] = [];

  for (const file of files) {
    try {
      const tags = await probeTags(file);
      const fallbackTitle = path
        .basename(file)
        .replace(/^\d+\.\s*/, "")
        .replace(/\.(mp3|flac|ogg|m4a|aac|opus)$/i, "");
      const title = tags.title || fallbackTitle;
      const artist = tags.artist || tags.album_artist || "";
      const album = tags.album || "";
      const year = (tags.date || tags.year || "").match(/\d{4}/)?.[0] || "0";

      const buffer = await readFile(file);
      const ext = path.extname(file).toLowerCase() || ".mp3";
      const mime = ext === ".flac" ? "audio/flac" : "audio/mpeg";
      // Copia a un Uint8Array con ArrayBuffer propio (satisface BlobPart en TS)
      const bytes = Uint8Array.from(buffer);

      const form = new FormData();
      form.append("title", title);
      form.append("artist", artist);
      form.append("album", album);
      form.append("year", year);
      form.append("audio", new Blob([bytes], { type: mime }), path.basename(file));

      const record = await pb.collection("songs").create(form);
      songs.push({ id: record.id, title, artist, album, year });
    } catch (error) {
      console.error(`Error subiendo ${file} a PocketBase:`, error);
      failed.push(path.basename(file));
    }
  }

  await rm(tmp, { recursive: true, force: true });

  if (songs.length === 0) {
    return NextResponse.json(
      { error: "No se pudo guardar ninguna canción en PocketBase", failed },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    count: songs.length,
    songs,
    failed,
  });
}
