/**
 * Typed errors for the Hitster pipeline so callers (API routes / pages) can map
 * a failure to a localized message and an HTTP status.
 */

export type HitsterErrorCode =
  | "invalid_code"
  | "card_not_found"
  | "spotify_unavailable"
  | "no_match"
  | "download_failed"
  | "unknown";

export class HitsterError extends Error {
  code: HitsterErrorCode;
  details?: string;

  constructor(code: HitsterErrorCode, message?: string, details?: string) {
    super(message || code);
    this.name = "HitsterError";
    this.code = code;
    this.details = details;
  }
}

export function isHitsterError(e: unknown): e is HitsterError {
  return e instanceof HitsterError;
}

export function toErrorCode(e: unknown): HitsterErrorCode {
  return isHitsterError(e) ? e.code : "unknown";
}

/** HTTP status that best matches an error code. */
export function statusForCode(code: HitsterErrorCode): number {
  switch (code) {
    case "invalid_code":
      return 400;
    case "card_not_found":
      return 404;
    default:
      return 502;
  }
}
