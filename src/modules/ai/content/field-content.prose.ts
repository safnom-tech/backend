import type { FieldContentType } from "./field-content.limits.js";

const PROSE_FIELD_TYPES: FieldContentType[] = [
  "description",
  "body",
  "quote",
  "generic",
];

export function shouldFormatAsParagraphs(
  fieldType: FieldContentType,
  wordCount: number
): boolean {
  return PROSE_FIELD_TYPES.includes(fieldType) && wordCount >= 24;
}

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Pick 1–5 sentences per paragraph with varied rhythm (deterministic from content). */
function variableSentenceCounts(totalSentences: number, seed: number): number[] {
  if (totalSentences <= 0) return [];
  const counts: number[] = [];
  let remaining = totalSentences;
  let s = seed;
  while (remaining > 0) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const maxPick = Math.min(5, remaining);
    const pick = 1 + (s % maxPick);
    counts.push(pick);
    remaining -= pick;
  }
  return counts;
}

/** Split long single-block copy into readable paragraphs (double newline). */
export function formatProseAsParagraphs(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes("\n\n")) {
    return trimmed
      .split(/\n\s*\n/)
      .map((p) => p.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .join("\n\n");
  }

  const sentences =
    trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((s) => s.trim()) ??
    [trimmed];
  if (sentences.length <= 2) return trimmed.replace(/\s+/g, " ");

  const counts = variableSentenceCounts(sentences.length, hashSeed(trimmed));
  const paragraphs: string[] = [];
  let idx = 0;
  for (const n of counts) {
    if (idx >= sentences.length) break;
    paragraphs.push(sentences.slice(idx, idx + n).join(" "));
    idx += n;
  }
  if (idx < sentences.length) {
    paragraphs.push(sentences.slice(idx).join(" "));
  }
  return paragraphs.filter(Boolean).join("\n\n");
}

export function formatLongFieldContent(
  text: string,
  fieldType: FieldContentType
): string {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (!shouldFormatAsParagraphs(fieldType, words)) {
    return text.trim().replace(/\s+/g, " ");
  }
  return formatProseAsParagraphs(text);
}
