import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// When the app runs behind a path-based reverse proxy (for example the
// code-server port proxy at https://host/proxy/3000/), Next.js has to know the
// public prefix so it emits correct asset URLs and client-side navigations.
// Set NEXT_BASE_PATH=/proxy/3000 (see scripts/serve.mjs). In a normal
// deployment the variable is empty and the app is served from the root.
const basePath = (process.env.NEXT_BASE_PATH || "").replace(/\/+$/, "");

// Keep Turbopack/file tracing scoped to this app even when a lockfile exists in
// a parent directory (e.g. /home/coder in code-server).
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // `output: "standalone"` is only needed for the Docker image (see Dockerfile).
  // Enabling it for local `next start` makes Next print a warning, so gate it.
  ...(process.env.NEXT_OUTPUT === "standalone"
    ? { output: "standalone" as const }
    : {}),
  turbopack: { root: projectRoot },
  outputFileTracingRoot: projectRoot,
  ...(basePath ? { basePath } : {}),
  // Exposed to client code so manual requests (fetch("/api/...")) go through
  // the proxy prefix too. Next.js only adds the prefix automatically to its own
  // assets and client-side navigation.
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn-images.dzcdn.net",
        pathname: "/images/cover/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
      },
      {
        protocol: "https",
        hostname: "img.youtube.com",
      },
    ],
  },
};

export default withNextIntl(nextConfig);
