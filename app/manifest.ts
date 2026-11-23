import type { MetadataRoute } from "next";

// Same proxy prefix logic as next.config.ts / scripts/serve.mjs: when the app
// runs behind a path-based reverse proxy (NEXT_BASE_PATH=/proxy/3000), icon
// URLs inside the manifest must carry the prefix too.
const basePath = (process.env.NEXT_BASE_PATH || "").replace(/\/+$/, "");

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Music Card Game",
    short_name: "MusicCards",
    description: "Scan music cards and play songs",
    start_url: `${basePath}/`,
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    orientation: "portrait-primary",
    icons: [
      {
        src: `${basePath}/icons/icon-192x192.png`,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icons/icon-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: `${basePath}/icons/icon-maskable-512x512.png`,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
