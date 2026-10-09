"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FIELD_CONTENT_LIMITS = exports.FIELD_CONTENT_TYPES = void 0;
exports.resolveFieldLimits = resolveFieldLimits;
exports.currentLengthMaxMultiplier = currentLengthMaxMultiplier;
exports.resolveLengthBoundsFromCurrent = resolveLengthBoundsFromCurrent;
exports.resolveWordCountGuidance = resolveWordCountGuidance;
exports.enforceFieldContentLimit = enforceFieldContentLimit;
exports.isProseFieldType = isProseFieldType;
exports.FIELD_CONTENT_TYPES = [
    "heading",
    "subheading",
    "title",
    "eyebrow",
    "description",
    "body",
    "button",
    "quote",
    "author",
    "planName",
    "price",
    "copyright",
    "navLabel",
    "logoText",
    "alt",
    "generic",
];
exports.FIELD_CONTENT_LIMITS = {
    heading: { maxChars: 200 },
    subheading: { maxChars: 200 },
    title: { maxChars: 200 },
    eyebrow: { maxChars: 120 },
    description: { maxChars: 8000, defaultMaxWords: 50, hardMaxWords: 500 },
    body: { maxChars: 8000, defaultMaxWords: 80, hardMaxWords: 800 },
    button: { maxChars: 80 },
    quote: { maxChars: 2000, defaultMaxWords: 60, hardMaxWords: 200 },
    author: { maxChars: 120 },
    planName: { maxChars: 120 },
    price: { maxChars: 80 },
    copyright: { maxChars: 200 },
    navLabel: { maxChars: 80 },
    logoText: { maxChars: 120 },
    alt: { maxChars: 300 },
    generic: { maxChars: 500, defaultMaxWords: 40, hardMaxWords: 120 },
};
function resolveFieldLimits(fieldType, maxChars, maxWords) {
    const base = exports.FIELD_CONTENT_LIMITS[fieldType] ?? exports.FIELD_CONTENT_LIMITS.generic;
    const chars = Math.min(maxChars ?? base.maxChars, base.maxChars);
    let words;
    if (maxWords !== undefined && base.defaultMaxWords !== undefined) {
        const cap = base.hardMaxWords ?? maxWords;
        words = Math.min(Math.max(1, maxWords), cap);
    }
    else if (fieldType === "description" || fieldType === "body" || fieldType === "quote") {
        words = base.defaultMaxWords;
    }
    return { maxChars: chars, maxWords: words };
}
/** +30% for most fields; description may grow up to +300% (4× current length). */
function currentLengthMaxMultiplier(fieldType) {
    return fieldType === "description" ? 4 : 1.3;
}
/** When the field already has copy, keep at least that size; cap growth by field multiplier. */
function resolveLengthBoundsFromCurrent(fieldType, currentValue, limits) {
    const mult = currentLengthMaxMultiplier(fieldType);
    const trimmed = currentValue?.trim() ?? "";
    const minChars = trimmed.length > 0 ? trimmed.length : null;
    let maxChars = limits.maxChars;
    if (minChars !== null) {
        const ceiling = Math.max(minChars, Math.ceil(minChars * mult));
        maxChars = Math.min(limits.maxChars, ceiling);
    }
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const minWords = wordCount > 0 ? wordCount : null;
    let maxWords = limits.maxWords;
    if (minWords !== null) {
        const wordCeiling = Math.max(minWords, Math.ceil(minWords * mult));
        if (maxWords !== undefined) {
            maxWords = Math.min(maxWords, wordCeiling);
            maxWords = Math.max(maxWords, minWords);
        }
        else {
            maxWords = wordCeiling;
        }
    }
    return { minChars, maxChars, minWords, maxWords };
}
/** Guidance for the model: long-form fields should fill a meaningful share of the word budget. */
function resolveWordCountGuidance(fieldType, maxWords, minWordsFromCurrent) {
    if (maxWords === undefined) {
        return { targetWords: null, minWords: null };
    }
    const shortTypes = [
        "button",
        "eyebrow",
        "price",
        "navLabel",
        "author",
        "planName",
        "alt",
    ];
    if (shortTypes.includes(fieldType)) {
        return { targetWords: maxWords, minWords: Math.max(1, maxWords - 2) };
    }
    if (maxWords <= 20) {
        const minWords = minWordsFromCurrent != null && minWordsFromCurrent > 0
            ? Math.min(maxWords, minWordsFromCurrent)
            : Math.max(1, maxWords - 3);
        return { targetWords: maxWords, minWords };
    }
    const minWords = minWordsFromCurrent != null && minWordsFromCurrent > 0
        ? Math.min(maxWords, minWordsFromCurrent)
        : Math.max(12, Math.floor(maxWords * 0.65));
    return { targetWords: maxWords, minWords };
}
function countWords(text) {
    return text.trim().split(/\s+/).filter(Boolean).length;
}
function isCompleteSentence(text) {
    const t = text.trim();
    return t.length > 0 && /[.!?]["']?\s*$/.test(t);
}
function extractSentenceRefs(text) {
    const trimmed = text.trim().replace(/\r\n/g, "\n");
    if (!trimmed)
        return [];
    const paragraphs = trimmed.split(/\n\s*\n/).filter(Boolean);
    const refs = [];
    paragraphs.forEach((para, paragraphIndex) => {
        const sents = para.match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g)?.map((s) => s.trim()) ?? [para.trim()];
        for (const s of sents) {
            if (s)
                refs.push({ text: s, paragraphIndex });
        }
    });
    return refs;
}
function joinSentenceRefs(refs) {
    if (!refs.length)
        return "";
    const paras = [];
    for (const ref of refs) {
        while (paras.length <= ref.paragraphIndex)
            paras.push([]);
        paras[ref.paragraphIndex].push(ref.text);
    }
    return paras.map((p) => p.join(" ")).filter(Boolean).join("\n\n");
}
function textFitsLimits(text, limits) {
    if (text.length > limits.maxChars)
        return false;
    if (limits.maxWords !== undefined && countWords(text) > limits.maxWords)
        return false;
    return true;
}
function dropIncompleteTrailingSentences(text) {
    const refs = extractSentenceRefs(text);
    while (refs.length > 0) {
        const last = refs[refs.length - 1].text;
        if (isCompleteSentence(last))
            return joinSentenceRefs(refs);
        refs.pop();
    }
    return text.trim();
}
function enforceFieldContentLimitBlunt(text, limits) {
    let out = text.trim().replace(/\r\n/g, "\n");
    if (limits.maxWords !== undefined) {
        const parts = out.split(/\s+/).filter(Boolean);
        if (parts.length > limits.maxWords) {
            out = parts.slice(0, limits.maxWords).join(" ");
        }
    }
    if (out.length > limits.maxChars) {
        out = out.slice(0, limits.maxChars).trim();
    }
    return out;
}
function enforceFieldContentLimit(text, limits, options) {
    let out = text.trim().replace(/\r\n/g, "\n");
    if (!out)
        return out;
    const useCompleteSentences = options?.completeSentences === true ||
        (options?.completeSentences !== false &&
            limits.maxWords !== undefined &&
            limits.maxWords > 12);
    if (!useCompleteSentences) {
        return dropIncompleteTrailingSentences(enforceFieldContentLimitBlunt(out, limits));
    }
    const refs = extractSentenceRefs(out);
    if (!refs.length) {
        return enforceFieldContentLimitBlunt(out, limits);
    }
    const kept = [];
    for (const ref of refs) {
        const candidate = joinSentenceRefs([...kept, ref]);
        if (textFitsLimits(candidate, limits)) {
            kept.push(ref);
            continue;
        }
        if (kept.length === 0) {
            kept.push(ref);
            break;
        }
        break;
    }
    out = joinSentenceRefs(kept);
    out = dropIncompleteTrailingSentences(out);
    if (!textFitsLimits(out, limits)) {
        out = dropIncompleteTrailingSentences(enforceFieldContentLimitBlunt(out, limits));
    }
    return out.trim();
}
function isProseFieldType(fieldType) {
    return (fieldType === "description" ||
        fieldType === "body" ||
        fieldType === "quote" ||
        fieldType === "generic");
}
