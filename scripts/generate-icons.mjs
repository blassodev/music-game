#!/usr/bin/env node
/**
 * Generates the full icon set from the SVG logo (app/icon.svg):
 *
 *   public/icons/icon-192x192.png          PWA icon, purpose "any"
 *   public/icons/icon-512x512.png          PWA icon, purpose "any"
 *   public/icons/icon-maskable-512x512.png PWA icon, purpose "maskable"
 *   app/apple-icon.png                     apple-touch-icon (180x180)
 *   app/favicon.ico                        multi-size (16/32/48) ICO
 *
 * The "maskable" and apple variants are full-bleed (no rounded corners)
 * because those platforms apply their own mask. Run with `npm run icons`
 * after editing app/icon.svg.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const logo = fs.readFileSync(path.join(root, "app/icon.svg"), "utf8");
const fullBleed = logo.replaceAll('rx="112" ry="112"', 'rx="0" ry="0"');

// Render the 512px-intrinsic SVG at 1024px once per variant, then downscale
// to each target size for smooth anti-aliasing.
const RENDER_SIZE = 1024;
const density = (RENDER_SIZE / 512) * 72;

async function render(svg) {
  return sharp(Buffer.from(svg), { density })
    .resize(RENDER_SIZE, RENDER_SIZE)
    .png()
    .toBuffer();
}

const toPng = (base, size) =>
  sharp(base).resize(size, size).png().toBuffer();

// Wrap PNG images in an ICO container (PNG-in-ICO, supported since Vista).
function buildIco(images) {
  const header = Buffer.alloc(6 + images.length * 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(images.length, 4);
  let offset = header.length;
  images.forEach(({ size, data }, i) => {
    const at = 6 + i * 16;
    header[at] = size >= 256 ? 0 : size; // width (0 = 256)
    header[at + 1] = size >= 256 ? 0 : size; // height (0 = 256)
    header.writeUInt16LE(1, at + 4); // color planes
    header.writeUInt16LE(32, at + 6); // bits per pixel
    header.writeUInt32LE(data.length, at + 8);
    header.writeUInt32LE(offset, at + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...images.map((image) => image.data)]);
}

const rounded = await render(logo);
const bleed = await render(fullBleed);

const outputs = [
  ["public/icons/icon-192x192.png", await toPng(rounded, 192)],
  ["public/icons/icon-512x512.png", await toPng(rounded, 512)],
  ["public/icons/icon-maskable-512x512.png", await toPng(bleed, 512)],
  ["app/apple-icon.png", await toPng(bleed, 180)],
  [
    "app/favicon.ico",
    buildIco([
      { size: 16, data: await toPng(rounded, 16) },
      { size: 32, data: await toPng(rounded, 32) },
      { size: 48, data: await toPng(rounded, 48) },
    ]),
  ],
];

for (const [file, data] of outputs) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, data);
  console.log(`✓ ${file} (${data.length} bytes)`);
}
