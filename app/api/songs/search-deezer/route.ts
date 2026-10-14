import { NextRequest, NextResponse } from "next/server";

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

  try {
    // Usar Python streamrip client directamente para búsqueda con metadata completa
    const { spawn } = await import("child_process");
    
    const pythonScript = `
import asyncio
import json
import sys
from streamrip.client.deezer import DeezerClient
from streamrip.config import Config

async def search_tracks(q, limit):
    config = Config('/app/rip/config.toml')
    client = DeezerClient(config)
    await client.login()
    
    # Usar el método search del cliente
    results = await client.search("track", q, limit=limit)
    
    # El resultado es una lista con un dict que tiene 'data'
    if results and len(results) > 0:
        return results[0].get('data', [])
    return []

if __name__ == '__main__':
    q = sys.argv[1]
    lim = int(sys.argv[2])
    try:
        tracks = asyncio.run(search_tracks(q, lim))
        print(json.dumps(tracks))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`;

    const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const proc = spawn("python3", ["-c", pythonScript, query, String(limit)], {
        timeout: 30000,
      });

      let stdout = "";
      let stderr = "";

      proc.stdout?.on("data", (data) => {
        stdout += data.toString();
      });

      proc.stderr?.on("data", (data) => {
        stderr += data.toString();
      });

      proc.on("close", (code) => {
        resolve({ stdout, stderr, code: code || 0 });
      });

      proc.on("error", (err) => {
        resolve({ stdout, stderr: err.message, code: 1 });
      });
    });

    if (result.code !== 0) {
      console.error("Deezer search error:", result.stderr);
      return NextResponse.json(
        { error: "Error al buscar en Deezer", details: result.stderr },
        { status: 502 }
      );
    }

    const rawTracks = JSON.parse(result.stdout.trim());

    if (rawTracks.error) {
      return NextResponse.json(
        { error: rawTracks.error },
        { status: 502 }
      );
    }

    // Transformar tracks de la API de Deezer a nuestro formato
    const results = rawTracks.map((track: any) => {
      const album = track.album || {};
      const artist = track.artist || track.contributors?.[0] || {};
      
      return {
        id: String(track.id),
        title: track.title || "",
        artist: artist.name || "",
        album: album.title || "",
        album_id: String(album.id || ""),
        duration: track.duration || 0,
        preview: track.preview || "",
        cover: album.cover_medium || album.cover || "",
        cover_big: album.cover_big || album.cover_medium || album.cover || "",
        type: "track",
      };
    });

    return NextResponse.json({
      ok: true,
      query,
      count: results.length,
      results,
    });
  } catch (err) {
    const raw = err as { message?: string; stderr?: string; stdout?: string; code?: number };
    console.error("Deezer search error:", raw);
    return NextResponse.json(
      { error: "Error al buscar en Deezer", details: raw.message || raw.stderr || String(err) },
      { status: 502 }
    );
  }
}