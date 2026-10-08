import type { FieldContentType } from "./field-content.limits.js";
import {
  enforceFieldContentLimit,
  isProseFieldType,
} from "./field-content.limits.js";

const SENTENCE_PARTS = [
  "We help audiences connect through authentic storytelling and memorable performances.",
  "Every project blends creativity, discipline, and a clear vision for the brand.",
  "From studio sessions to live events, the focus stays on quality and impact.",
  "Clients choose us for reliability, professionalism, and results that feel personal.",
  "The work spans collaborations, original releases, and tailored experiences for each venue.",
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function fitsLimits(
  text: string,
  limits: { maxChars: number; maxWords?: number }
): boolean {
  if (text.length > limits.maxChars) return false;
  if (limits.maxWords !== undefined && countWords(text) > limits.maxWords) return false;
  return true;
}

export function buildMockFieldContent(params: {
  fieldType: FieldContentType;
  userPrompt: string;
  businessName: string;
  limits: { maxChars: number; maxWords?: number };
}): string {
  const { fieldType, userPrompt, businessName, limits } = params;
  const topic = userPrompt.trim() || "your offering";
  const name = businessName.trim() || "your business";
  const limitOpts = { completeSentences: isProseFieldType(fieldType) };

  if (fieldType === "button") {
    return enforceFieldContentLimit(`Book ${topic.split(/\s+/)[0] ?? "now"}`, limits, limitOpts);
  }

  if (
    fieldType === "heading" ||
    fieldType === "title" ||
    fieldType === "subheading" ||
    fieldType === "eyebrow"
  ) {
    const short = `${topic.charAt(0).toUpperCase()}${topic.slice(1)} — ${name}`;
    return enforceFieldContentLimit(short.slice(0, 120), limits, limitOpts);
  }

  const targetWords = limits.maxWords ?? 40;
  const intro = `${name} is a ${topic}-focused experience built for modern audiences.`;
  const pool: string[] = [intro];
  for (let i = 0; i < 24; i += 1) {
    pool.push(SENTENCE_PARTS[i % SENTENCE_PARTS.length]!);
  }

  const sentences: string[] = [];
  for (const sent of pool) {
    const candidate = [...sentences, sent].join(" ");
    if (!fitsLimits(candidate, limits)) break;
    sentences.push(sent);
    if (countWords(candidate) >= targetWords) break;
  }

  if (!sentences.length) {
    return enforceFieldContentLimit(intro, limits, limitOpts);
  }

  const seed = sentences.join(" ").length;
  const counts: number[] = [];
  let s = seed;
  let rem = sentences.length;
  while (rem > 0) {
    s = (Math.imul(s, 1103515245) + 12345) >>> 0;
    const maxPick = Math.min(5, rem);
    const pick = 1 + (s % maxPick);
    counts.push(pick);
    rem -= pick;
  }
  const paragraphs: string[] = [];
  let idx = 0;
  for (const n of counts) {
    const chunk = sentences.slice(idx, idx + n).join(" ");
    if (!chunk) continue;
    const candidate = paragraphs.length ? `${paragraphs.join("\n\n")}\n\n${chunk}` : chunk;
    if (!fitsLimits(candidate, limits)) break;
    paragraphs.push(chunk);
    idx += n;
  }

  let content = (paragraphs.length ? paragraphs : [sentences.join(" ")]).join("\n\n").trim();
  return enforceFieldContentLimit(content, limits, limitOpts);
}
