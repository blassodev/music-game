import { NextRequest, NextResponse } from "next/server";
import { execFile } from "child_process";
import { promisify } from "util";
import { mkdtemp, rm, readFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

const execFileAsync = promisify(execFile);
const RIP_CONFIG = "/app/rip/config.toml";

interface SearchResult {
  id: string;
  title: string;
  artist: string;
  album: string;
  album_id: string;
  duration: number;
  preview: string;
  cover: string;
  cover_big: string;
  type: "track";
}

export async function POST(request: NextRequest) {
  let query: string;
  let limit = 20;

  try {
    const body = await request.json();
    query = String(body.query || "").trim();
    limit = Math.min(Number(body.limit) || 20, 50);
  } catch {
    return NextResponse.json({ error: "Query requerida" }, { status: 400 });
  }

  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "La búsqueda debe tener al menos 2 caracteres" },
      { status: 400 }
    );
  }

  // Crear archivo temporal para la salida
  const tmpDir = await mkdtemp(path.join(tmpdir(), "rip-search-"));
  const outputFile = path.join(tmpDir, "results.json");

  try {
    // Usar streamrip para buscar en Deezer
    // rip search deezer track "query" --output-file /tmp/results.json --num-results N
    await execFileAsync(
      "rip",
      [
        "--config-path",
        RIP_CONFIG,
        "search",
        "deezer",
        "track",
        query,
        "--output-file",
        outputFile,
        "--num-results",
        String(limit),
      ],
      { timeout: 30000, maxBuffer: 4 * 1024 * 1024 }
    );

    // Leer el archivo de resultados
    const stdout = await readFile(outputFile, "utf-8");
    const rawResults = JSON.parse(stdout);

    // El output de streamrip search es un array de objetos con:
    // { source, media_type, id, desc: "Title by Artist" }
    const results: SearchResult[] = [];

    if (rawResults && Array.isArray(rawResults)) {
      for (const item of rawResults) {
        if (item.id && item.desc) {
          // Parsear "Title by Artist" del campo desc
          const desc = item.desc;
          const byIndex = desc.lastIndexOf(" by ");
          let title = desc;
          let artist = "";
          if (byIndex > 0) {
            title = desc.substring(0, byIndex);
            artist = desc.substring(byIndex + 4);
          }

          results.push({
            id: String(item.id),
            title,
            artist,
            album: "",
            album_id: "",
            duration: 0,
            preview: "",
            cover: "",
            cover_big: "",
            type: "track",
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      query,
      count: results.length,
      results,
    });
  } catch (err) {
    const raw = err as { stderr?: string; message?: string; stdout?: string; code?: number };
    const details = String(raw.stderr || raw.message || raw.stdout || "").slice(-500);
    console.error("Deezer search error:", {
      message: raw.message,
      stderr: raw.stderr,
      stdout: raw.stdout?.slice(-500),
      code: raw.code,
    });

    // Si falla el CLI, intentar parsear stdout por si hay resultados parciales
    if (raw.stdout) {
      try {
        const rawResults = JSON.parse(raw.stdout);
        const results: SearchResult[] = [];
        if (rawResults?.[0]?.data) {
          for (const item of rawResults[0].data) {
            results.push({
              id: String(item.id),
              title: item.title || "",
              artist: item.artist?.name || item.artists?.[0]?.name || "",
              album: item.album?.title || "",
              album_id: String(item.album?.id || ""),
              duration: item.duration || 0,
              preview: item.preview || "",
              cover: item.album?.cover_medium || item.album?.cover || "",
              cover_big: item.album?.cover_xl || item.album?.cover_big || item.album?.cover || "",
              type: "track",
            });
          }
          return NextResponse.json({ ok: true, query, count: results.length, results });
        }
      } catch {
        // Ignorar error de parseo
      }
    }

    return NextResponse.json(
      { error: "Error al buscar en Deezer", details },
      { status: 502 }
    );
  } finally {
    // Limpiar archivo temporal
    await rm(tmpDir, { recursive: true, force: true });
  }
}