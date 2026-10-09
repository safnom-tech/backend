"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.shouldFormatAsParagraphs = shouldFormatAsParagraphs;
exports.formatProseAsParagraphs = formatProseAsParagraphs;
exports.formatLongFieldContent = formatLongFieldContent;
const PROSE_FIELD_TYPES = [
    "description",
    "body",
    "quote",
    "generic",
];
function shouldFormatAsParagraphs(fieldType, wordCount) {
    return PROSE_FIELD_TYPES.includes(fieldType) && wordCount >= 24;
}
function hashSeed(text) {
    let h = 2166136261;
    for (let i = 0; i < text.length; i += 1) {
        h ^= text.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
/** Pick 1–5 sentences per paragraph with varied rhythm (deterministic from content). */
function variableSentenceCounts(totalSentences, seed) {
    if (totalSentences <= 0)
        return [];
    const counts = [];
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
function formatProseAsParagraphs(text) {
    const trimmed = text.trim();
    if (!trimmed)
        return trimmed;
    if (trimmed.includes("\n\n")) {
        return trimmed
            .split(/\n\s*\n/)
            .map((p) => p.trim().replace(/\s+/g, " "))
            .filter(Boolean)
            .join("\n\n");
    }
    const sentences = trimmed.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((s) => s.trim()) ??
        [trimmed];
    if (sentences.length <= 2)
        return trimmed.replace(/\s+/g, " ");
    const counts = variableSentenceCounts(sentences.length, hashSeed(trimmed));
    const paragraphs = [];
    let idx = 0;
    for (const n of counts) {
        if (idx >= sentences.length)
            break;
        paragraphs.push(sentences.slice(idx, idx + n).join(" "));
        idx += n;
    }
    if (idx < sentences.length) {
        paragraphs.push(sentences.slice(idx).join(" "));
    }
    return paragraphs.filter(Boolean).join("\n\n");
}
function formatLongFieldContent(text, fieldType) {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    if (!shouldFormatAsParagraphs(fieldType, words)) {
        return text.trim().replace(/\s+/g, " ");
    }
    return formatProseAsParagraphs(text);
}
