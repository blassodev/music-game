/**
 * Base path the app is served under (e.g. "/proxy/3000" behind the code-server
 * port proxy). Empty when the app is served from the domain root.
 *
 * Inlined at build time through `env` in next.config.ts.
 */
export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/**
 * Prefix a root-relative path with the app base path. Next.js already does this
 * for `<Link>` and assets; use it for manual requests such as `fetch()`.
 */
export function withBasePath(path: string): string {
  return `${basePath}${path}`;
}
