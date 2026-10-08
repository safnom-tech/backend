import { randomBytes } from "node:crypto";

/** Ambiguity-safe alphabet (no 0/O, 1/I/L). */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

function randomSegment(length: number): string {
  const bytes = randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i += 1) {
    out += ALPHABET[bytes[i]! % ALPHABET.length];
  }
  return out;
}

/** Human-readable non-sequential ID, e.g. WEB-7F92LX or SAF-8K4M2P. */
export function generatePrefixedPublicId(
  prefix: "WEB" | "SAF",
  segmentLength = 6
): string {
  return `${prefix}-${randomSegment(segmentLength)}`;
}
