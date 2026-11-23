import type { HitsterCode } from "./types";

/**
 * Parsing/validation helpers for Hitster QR codes.
 *
 * A physical card encodes a URL like:
 *   http://www.hitstergame.com/de/aaaa0064/00281
 *                              └lang┘ └─sku──┘ └card┘
 *
 * We match on the path shape (domain-agnostic) so other regional domains and
 * bare `sku/card` strings also work. This module is client-safe (no Node APIs).
 */

const SKU_RE = /^aaaa\d{4}$/i;
const CARD_RE = /^\d{3,6}$/;

export function isValidSku(sku: string): boolean {
  return SKU_RE.test((sku || "").trim());
}

export function isValidCard(card: string): boolean {
  return CARD_RE.test((card || "").trim());
}

/** Normalize a card number to its integer value (drops leading zeros). */
export function cardToInt(card: string): number {
  return parseInt((card || "").trim(), 10);
}

/**
 * Extract `{ lang, sku, card }` from a scanned value, or `null` when the value
 * is not a recognizable Hitster code (e.g. a plain PocketBase song id).
 */
export function parseHitsterCode(raw: string): HitsterCode | null {
  const text = (raw || "").trim();
  if (!text) return null;

  let segments: string[];
  if (/^https?:\/\//i.test(text)) {
    try {
      segments = new URL(text).pathname.split("/").filter(Boolean);
    } catch {
      segments = text.split(/[?#]/)[0].split("/").filter(Boolean);
    }
  } else {
    segments = text.split(/[?#]/)[0].split("/").filter(Boolean);
  }

  const skuIdx = segments.findIndex((s) => SKU_RE.test(s));
  if (skuIdx === -1) return null;

  const sku = segments[skuIdx].toLowerCase();
  const card = segments[skuIdx + 1];
  if (!card || !CARD_RE.test(card)) return null;

  const lang = skuIdx > 0 ? segments[skuIdx - 1].toLowerCase() : "";
  return { lang, sku, card };
}

/** True when the scanned value looks like a Hitster card. */
export function isHitsterCode(raw: string): boolean {
  return parseHitsterCode(raw) !== null;
}
