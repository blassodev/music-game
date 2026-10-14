import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  let trackId: string;

  try {
    const body = await request.json();
    trackId = String(body.trackId || "").trim();
  } catch {
    return NextResponse.json({ error: "trackId requerido" }, { status: 400 });
  }

  if (!trackId) {
    return NextResponse.json(
      { error: "trackId requerido" },
      { status: 400 }
    );
  }

  try {
    // Usar Python script para obtener metadata via streamrip client
    const { spawn } = await import("child_process");
    const pythonScript = `
import asyncio
import json
import sys
from streamrip.client.deezer import DeezerClient
from streamrip.config import Config

async def get_track(track_id):
    config = Config('/app/rip/config.toml')
    client = DeezerClient(config)
    await client.login()
    track = await client.get_metadata(track_id, 'track')
    return track

if __name__ == '__main__':
    track_id = sys.argv[1]
    try:
        result = asyncio.run(get_track(track_id))
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
`;

    const result = await new Promise<{ stdout: string; stderr: string; code: number }>((resolve) => {
      const proc = spawn("python3", ["-c", pythonScript, trackId], {
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
      console.error("Deezer track detail error:", result.stderr);
      return NextResponse.json(
        { error: "Error al obtener detalles del track", details: result.stderr },
        { status: 502 }
      );
    }

    const track = JSON.parse(result.stdout.trim());

    if (track.error) {
      return NextResponse.json(
        { error: track.error },
        { status: 502 }
      );
    }

    // Extraer los campos que necesitamos
    const album = track.album || {};
    const artist = track.artist || track.contributors?.[0] || {};

    return NextResponse.json({
      ok: true,
      track: {
        id: String(track.id || trackId),
        title: track.title || "",
        artist: artist.name || "",
        album: album.title || "",
        album_id: String(album.id || ""),
        duration: track.duration || 0,
        preview: track.preview || "",
        cover: album.cover_medium || album.cover || "",
        cover_big: album.cover_big || album.cover_medium || album.cover || "",
        cover_xl: album.cover_xl || "",
        year: (album.release_date || "").toString().substring(0, 4) || "0",
        explicit: track.explicit_lyrics || track.explicit_content_lyrics > 0 || false,
        type: "track",
      },
    });
  } catch (err) {
    const raw = err as { message?: string; stderr?: string; stdout?: string; code?: number };
    console.error("Deezer track detail error:", raw);
    return NextResponse.json(
      { error: "Error al obtener detalles del track", details: raw.message || raw.stderr || String(err) },
      { status: 502 }
    );
  }
}