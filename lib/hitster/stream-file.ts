import { createReadStream } from "fs";
import { stat } from "fs/promises";
import { Readable } from "stream";

/**
 * Serve a local file from a Route Handler with HTTP Range support so the
 * browser <audio> element can start playing progressively and seek.
 */

type WebStream = ReadableStream<Uint8Array>;

function toWeb(nodeStream: Readable): WebStream {
  return Readable.toWeb(nodeStream) as unknown as WebStream;
}

function parseRange(
  header: string | null,
  size: number
): { start: number; end: number } | null {
  if (!header) return null;
  const m = /bytes=(\d*)-(\d*)/.exec(header);
  if (!m) return null;

  const rawStart = m[1];
  const rawEnd = m[2];

  // suffix range: bytes=-N  (last N bytes)
  if (!rawStart && rawEnd) {
    const n = parseInt(rawEnd, 10);
    if (Number.isNaN(n) || n <= 0) return null;
    const start = Math.max(0, size - n);
    return { start, end: size - 1 };
  }

  const start = rawStart ? parseInt(rawStart, 10) : 0;
  let end = rawEnd ? parseInt(rawEnd, 10) : size - 1;
  if (Number.isNaN(start)) return null;
  if (Number.isNaN(end) || end > size - 1) end = size - 1;
  return { start, end };
}

export async function streamFile(
  filePath: string,
  mime: string,
  rangeHeader: string | null
): Promise<Response> {
  const st = await stat(filePath);
  const size = st.size;

  const headers = new Headers();
  headers.set("Accept-Ranges", "bytes");
  headers.set("Content-Type", mime);
  headers.set("Cache-Control", "private, max-age=0, no-transform");

  const range = parseRange(rangeHeader, size);
  if (range) {
    const { start, end } = range;
    if (start > end || start >= size) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    const body = toWeb(createReadStream(filePath, { start, end }));
    return new Response(body, { status: 206, headers });
  }

  headers.set("Content-Length", String(size));
  const body = toWeb(createReadStream(filePath));
  return new Response(body, { status: 200, headers });
}
