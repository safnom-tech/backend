"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldContentSystemPrompt = fieldContentSystemPrompt;
exports.fieldContentUserPrompt = fieldContentUserPrompt;
const field_content_limits_js_1 = require("./field-content.limits.js");
function fieldContentSystemPrompt() {
    return `You are Safnom field content generator (field content generator). Return ONLY JSON: { "content": "..." }
Match the role: heading/title/eyebrow/button = short phrases; description/body/quote = full prose paragraphs.
Write professional website copy. No HTML, markdown, or quotes around the whole response.
When targetWords and minWords are set, write AT LEAST minWords and aim for roughly targetWords (never a single short sentence unless maxWords <= 15).
For description/body/quote with targetWords >= 24, use multiple paragraphs separated by blank lines (\\n\\n).
Vary paragraph length naturally (e.g. one paragraph 1–2 sentences, another 4–5); do not give every paragraph the same number of sentences.
When minChars is set, output length must be at least minChars and must not exceed maxChars.
Every sentence must be grammatically complete and end with . ! or ? — never stop mid-phrase or mid-sentence.
Never exceed maxChars or maxWords.`;
}
function fieldContentUserPrompt(params) {
    const guidance = (0, field_content_limits_js_1.resolveWordCountGuidance)(params.fieldType, params.maxWords, params.minWords ?? null);
    return JSON.stringify({
        fieldType: params.fieldType,
        userPrompt: params.prompt,
        maxChars: params.maxChars,
        minChars: params.minChars ?? null,
        maxWords: params.maxWords ?? null,
        targetWords: guidance.targetWords,
        minWords: guidance.minWords,
        mode: params.mode,
        currentValue: params.currentValue ?? null,
        business: params.businessContext ?? null,
    });
}
