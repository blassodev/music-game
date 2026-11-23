/**
 * Small text-normalization + similarity helpers used to rank Deezer candidates
 * against the metadata scraped from Spotify. Kept dependency-free and pure.
 */

/** Lowercase, strip accents, turn non-alphanumerics into single spaces. */
export function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const VERSION_TOKENS = new Set([
  "remix",
  "mix",
  "version",
  "edit",
  "remaster",
  "remastered",
  "mono",
  "stereo",
  "single",
  "radio",
  "live",
  "acoustic",
  "cover",
  "deluxe",
  "bonus",
  "mix",
  "club",
  "dub",
  "instrumental",
]);

/** Remove version/remix tokens and parenthetical groups to get a "core" title. */
export function stripVersion(s: string): string {
  const n = normalize(s.replace(/\(([^)]*)\)/g, " ").replace(/\[([^\]]*)\]/g, " "));
  return n
    .split(" ")
    .filter((t) => t && !VERSION_TOKENS.has(t))
    .join(" ");
}

export function tokenize(s: string): string[] {
  return normalize(s).split(" ").filter(Boolean);
}

/** Jaccard similarity over token sets (0..1). */
export function tokenJaccard(a: string, b: string): number {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (sa.size === 0 || sb.size === 0) return 0;
  let inter = 0;
  sa.forEach((t) => {
    if (sb.has(t)) inter++;
  });
  const union = sa.size + sb.size - inter;
  return union === 0 ? 0 : inter / union;
}

/** Classic Levenshtein distance. */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** Similarity ratio (0..1) derived from Levenshtein distance. */
export function levenshteinRatio(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  const max = Math.max(na.length, nb.length);
  if (max === 0) return 0;
  return 1 - levenshtein(na, nb) / max;
}

export function clamp(v: number, min = 0, max = 1): number {
  return Math.max(min, Math.min(max, v));
}
