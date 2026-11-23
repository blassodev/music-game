#!/usr/bin/env node
/**
 * Dev/start/build launcher that makes Next.js work behind a path-based reverse
 * proxy such as the code-server port proxy (`https://host/proxy/3000/`).
 *
 * code-server strips the `/proxy/<port>` prefix before forwarding the request,
 * but Next.js needs that prefix at build time (`basePath`) so that generated
 * asset URLs and client-side navigations point back through the proxy. This
 * script adds the prefix back on the way to Next and strips it from redirect
 * `Location` headers on the way out (code-server re-adds it automatically).
 *
 * Usage:
 *   node scripts/serve.mjs dev     # npm run dev
 *   node scripts/serve.mjs start   # npm start
 *   node scripts/serve.mjs build   # npm run build
 *
 * The prefix is taken from NEXT_BASE_PATH, or detected from VSCODE_PROXY_URI.
 * Without a detected prefix everything runs exactly like plain Next.js, so
 * Docker/production deployments are unaffected.
 */
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = require.resolve("next/dist/bin/next");

const mode = ["dev", "start", "build"].includes(process.argv[2])
  ? process.argv[2]
  : "start";

const PORT = Number(process.env.PORT || 3000);
const INTERNAL_PORT = Number(process.env.INTERNAL_PORT || PORT + 1);

function normalizeBasePath(value) {
  const trimmed = (value || "").trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
}

function detectBasePath() {
  if (process.env.NEXT_BASE_PATH !== undefined) {
    return normalizeBasePath(process.env.NEXT_BASE_PATH);
  }
  // code-server exposes e.g. https://ide.example.com/proxy/{{port}}/
  const proxyUri = process.env.VSCODE_PROXY_URI;
  if (proxyUri) {
    try {
      const resolved = proxyUri.replaceAll("{{port}}", String(PORT));
      return normalizeBasePath(new URL(resolved).pathname);
    } catch {
      // Ignore malformed values and fall back to serving from the root.
    }
  }
  return "";
}

const basePath = detectBasePath();
const nextEnv = { ...process.env, NEXT_BASE_PATH: basePath };

function runNext(args, env = nextEnv) {
  return spawn(process.execPath, [nextBin, ...args], {
    cwd: root,
    env,
    stdio: "inherit",
  });
}

// Runs `next build`, mirroring its output to our stdout/stderr. Next.js may
// abort the first run of a build/dev command to print a security upgrade
// notice ("Retry the same command to continue"), so retry once in that case.
function runNextBuild() {
  const attempt = () =>
    new Promise((resolve) => {
      const child = spawn(process.execPath, [nextBin, "build"], {
        cwd: root,
        env: nextEnv,
        stdio: ["inherit", "pipe", "pipe"],
      });
      let output = "";
      const forward = (stream, target) => {
        stream?.on("data", (chunk) => {
          output += chunk.toString();
          target.write(chunk);
        });
      };
      forward(child.stdout, process.stdout);
      forward(child.stderr, process.stderr);
      child.on("exit", (code, signal) =>
        resolve({ code: code ?? (signal ? 1 : 0), output })
      );
    });

  return attempt().then((result) => {
    if (
      result.code !== 0 &&
      /stopped to show the upgrade recommendation/i.test(result.output)
    ) {
      console.log("\n▸ Next.js asked to retry the build, running it again...");
      return attempt();
    }
    return result;
  });
}

function currentBuildBasePath() {
  try {
    const manifest = JSON.parse(
      fs.readFileSync(path.join(root, ".next", "routes-manifest.json"), "utf8")
    );
    return normalizeBasePath(manifest.basePath);
  } catch {
    return null;
  }
}

async function ensureProductionBuild() {
  if (!fs.existsSync(path.join(root, ".next", "BUILD_ID"))) {
    console.log("▸ No production build found, running `next build`...");
  } else if (currentBuildBasePath() !== basePath) {
    console.log(
      `▸ Existing build does not target "${basePath || "/"}", rebuilding...`
    );
  } else {
    return;
  }

  const { code } = await runNextBuild();

  if (code !== 0) process.exit(code);
}

function waitForPort(port, timeoutMs = 180_000) {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.connect({ host: "127.0.0.1", port });
      socket.setTimeout(1000);
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("timeout", () => {
        socket.destroy();
        retry();
      });
      socket.once("error", () => {
        socket.destroy();
        retry();
      });
    };
    const retry = () => {
      if (Date.now() > deadline) {
        reject(new Error(`Timed out waiting for port ${port}`));
        return;
      }
      setTimeout(attempt, 200);
    };
    attempt();
  });
}

function toUpstreamPath(url) {
  // code-server can forward a leading "//" when the prefix is stripped.
  const pathname = (url || "/").replace(/^\/+/, "/");
  if (!basePath) return pathname;

  // The public root is "/proxy/<port>/", but Next.js canonicalises the
  // basePath root without the trailing slash ("/proxy/<port>"). Map it
  // directly so the proxy and Next do not bounce redirects between each other.
  if (pathname === `${basePath}/`) return basePath;
  if (pathname === "/" || pathname.startsWith("/?")) {
    return `${basePath}${pathname.slice(1)}`;
  }
  if (
    pathname === basePath ||
    pathname.startsWith(`${basePath}/`) ||
    pathname.startsWith(`${basePath}?`)
  ) {
    return pathname;
  }
  return `${basePath}${pathname}`;
}

function rewriteLocation(location) {
  if (!basePath || !location) return location;
  // Relative redirect emitted by Next (e.g. "/proxy/3000/admin-login").
  if (location === basePath) return "/";
  if (location.startsWith(`${basePath}/`)) {
    return location.slice(basePath.length);
  }
  // Next keeps the query string in some redirects ("/proxy/3000?_rsc=...").
  if (location.startsWith(`${basePath}?`) || location.startsWith(`${basePath}#`)) {
    return location.slice(basePath.length);
  }
  // Absolute redirect pointing at the same proxy path.
  try {
    const url = new URL(location);
    if (url.pathname === basePath || url.pathname.startsWith(`${basePath}/`)) {
      url.pathname = url.pathname.slice(basePath.length) || "/";
      return url.toString();
    }
  } catch {
    // Not an absolute URL: leave untouched.
  }
  return location;
}

function createPrefixProxy() {
  const server = http.createServer((req, res) => {
    const headers = { ...req.headers };
    headers.host =
      req.headers["x-forwarded-host"] || req.headers.host || `localhost:${PORT}`;
    headers["x-forwarded-host"] = headers.host;
    headers["x-forwarded-proto"] = req.headers["x-forwarded-proto"] || "http";

    const upstream = http.request(
      {
        host: "127.0.0.1",
        port: INTERNAL_PORT,
        method: req.method,
        path: toUpstreamPath(req.url),
        headers,
      },
      (upstreamRes) => {
        const responseHeaders = { ...upstreamRes.headers };
        if (responseHeaders.location) {
          responseHeaders.location = rewriteLocation(responseHeaders.location);
        }
        res.writeHead(upstreamRes.statusCode || 502, responseHeaders);
        upstreamRes.pipe(res);
      }
    );

    upstream.on("error", (error) => {
      if (!res.headersSent) {
        res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
      }
      res.end(`Bad gateway: ${error.message}`);
    });

    req.pipe(upstream);
  });

  // Forward WebSocket upgrades (used by the Next dev server HMR channel).
  server.on("upgrade", (req, socket, head) => {
    const upstream = net.connect(
      { host: "127.0.0.1", port: INTERNAL_PORT },
      () => {
        const headers = [];
        for (let i = 0; i < req.rawHeaders.length; i += 2) {
          headers.push(`${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}`);
        }
        upstream.write(
          `${req.method} ${toUpstreamPath(req.url)} HTTP/1.1\r\n${headers.join(
            "\r\n"
          )}\r\n\r\n`
        );
        if (head?.length) upstream.write(head);
        upstream.pipe(socket);
        socket.pipe(upstream);
      }
    );

    upstream.on("error", () => socket.destroy());
    socket.on("error", () => upstream.destroy());
  });

  return server;
}

function forwardSignals(child) {
  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      if (!child.killed) child.kill(signal);
    });
  }
}

async function main() {
  if (mode === "build") {
    const { code } = await runNextBuild();
    process.exit(code);
  }

  if (!basePath) {
    // Plain deployment (Docker, VPS, ...): no proxy prefix to handle.
    const args = [mode, "-p", String(PORT)];
    if (mode === "dev") args.push("-H", "0.0.0.0");
    const child = runNext(args);
    forwardSignals(child);
    child.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));
    return;
  }

  console.log(`▸ Serving under base path: ${basePath} (port ${PORT} → ${INTERNAL_PORT})`);

  if (mode === "start") {
    await ensureProductionBuild();
  }

  const next = runNext([mode, "-p", String(INTERNAL_PORT), "-H", "127.0.0.1"]);
  forwardSignals(next);
  next.on("exit", (code, signal) => process.exit(code ?? (signal ? 1 : 0)));

  try {
    await waitForPort(INTERNAL_PORT);
  } catch (error) {
    console.error(error.message);
    next.kill("SIGTERM");
    process.exit(1);
  }

  const proxy = createPrefixProxy();
  proxy.listen(PORT, "0.0.0.0", () => {
    console.log(`▸ Proxy ready: http://localhost:${PORT}${basePath}/`);
  });

  process.on("SIGINT", () => proxy.close());
  process.on("SIGTERM", () => proxy.close());
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
