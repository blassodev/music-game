import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Importar ytdl-core dinámicamente
    const ytdl = (await import("ytdl-core")).default;

    // Validar si es una URL de YouTube válida
    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Obtener información del video con opciones adicionales
    const info = await ytdl.getInfo(url, {
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    });

    const videoDetails = info.videoDetails;

    // Obtener formatos de audio disponibles con filtrado mejorado
    const audioFormats = ytdl
      .filterFormats(info.formats, "audioonly")
      .filter(
        (format) => format.hasAudio && !format.hasVideo && format.audioBitrate
      );

    if (audioFormats.length === 0) {
      return NextResponse.json(
        { error: "No audio formats available for this video" },
        { status: 400 }
      );
    }

    /* eslint-disable @typescript-eslint/no-explicit-any */
    const qualities = audioFormats
      .map((format: any) => ({
        itag: format.itag,
        quality: format.quality || "unknown",
        audioBitrate: format.audioBitrate || 0,
        audioCodec: format.audioCodec || "unknown",
        container: format.container || "unknown",
        url: format.url,
      }))
      .sort((a, b) => (b.audioBitrate || 0) - (a.audioBitrate || 0)); // Ordenar por calidad

    return NextResponse.json({
      title: videoDetails.title,
      author: videoDetails.author?.name || "",
      lengthSeconds: videoDetails.lengthSeconds,
      description: videoDetails.description,
      thumbnail: videoDetails.thumbnails?.[0]?.url,
      qualities: qualities,
    });
  } catch (error) {
    console.error("Error fetching video info:", error);

    let errorMessage = "Failed to fetch video information";

    if (error instanceof Error) {
      if (error.message.includes("Could not extract functions")) {
        errorMessage =
          "YouTube temporarily blocked the request. Please try again later or use a different video.";
      } else if (error.message.includes("Video unavailable")) {
        errorMessage = "This video is not available or has been removed.";
      } else if (error.message.includes("Private video")) {
        errorMessage = "This is a private video and cannot be accessed.";
      } else if (error.message.includes("Age-restricted")) {
        errorMessage = "This video is age-restricted and cannot be processed.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");
    const itag = searchParams.get("itag");

    if (!url || !itag) {
      return NextResponse.json(
        { error: "URL and itag are required" },
        { status: 400 }
      );
    }

    // Importar ytdl-core dinámicamente
    const ytdl = (await import("ytdl-core")).default;

    if (!ytdl.validateURL(url)) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    // Crear stream de descarga con opciones mejoradas
    const audioStream = ytdl(url, {
      quality: itag,
      filter: "audioonly",
      requestOptions: {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      },
    });

    // Obtener información del video para el nombre del archivo
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title
      .replace(/[^\w\s-]/gi, "")
      .replace(/\s+/g, "_");

    // Configurar headers para descarga
    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set("Content-Disposition", `attachment; filename="${title}.mp3"`);

    // Convertir el stream de Node.js a ReadableStream para la Response
    const readableStream = new ReadableStream({
      start(controller) {
        /* eslint-disable @typescript-eslint/no-explicit-any */
        audioStream.on("data", (chunk: any) => {
          controller.enqueue(chunk);
        });

        audioStream.on("end", () => {
          controller.close();
        });

        audioStream.on("error", (error: any) => {
          console.error("Stream error:", error);
          controller.error(error);
        });
      },
    });

    return new Response(readableStream, {
      headers,
    });
  } catch (error) {
    console.error("Error downloading audio:", error);

    let errorMessage = "Failed to download audio";

    if (error instanceof Error) {
      if (error.message.includes("Could not extract functions")) {
        errorMessage =
          "YouTube temporarily blocked the download. Please try a different video or try again later.";
      } else if (error.message.includes("403")) {
        errorMessage =
          "Access forbidden. The video may be restricted or unavailable.";
      } else {
        errorMessage = error.message;
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
