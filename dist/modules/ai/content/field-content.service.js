"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFieldContent = generateFieldContent;
const zod_1 = require("zod");
const error_middleware_js_1 = require("../../../middleware/error.middleware.js");
const ai_sanitize_js_1 = require("../ai.sanitize.js");
const index_js_1 = require("../providers/index.js");
const ai_response_parser_js_1 = require("../utils/ai-response-parser.js");
const field_content_limits_js_1 = require("./field-content.limits.js");
const field_content_prompts_js_1 = require("./field-content.prompts.js");
const field_content_prose_js_1 = require("./field-content.prose.js");
const resultSchema = zod_1.z.object({
    content: zod_1.z.string(),
});
async function completeJsonOnce(systemPrompt, userPrompt) {
    const provider = (0, index_js_1.getAIProvider)();
    const raw = await provider.completeJson({ systemPrompt, userPrompt });
    if (typeof raw === "string") {
        return (0, ai_response_parser_js_1.parseJsonFromModelText)(raw);
    }
    return raw;
}
async function generateFieldContent(input) {
    const prompt = input.prompt?.trim();
    if (!prompt) {
        throw new error_middleware_js_1.AppError("prompt is required", 400, "VALIDATION_ERROR");
    }
    const limits = (0, field_content_limits_js_1.resolveFieldLimits)(input.fieldType, input.maxChars, input.maxWords);
    const bounds = (0, field_content_limits_js_1.resolveLengthBoundsFromCurrent)(input.fieldType, input.currentValue, limits);
    const effectiveLimits = {
        maxChars: bounds.maxChars,
        maxWords: bounds.maxWords,
    };
    let parsed;
    try {
        parsed = await completeJsonOnce((0, field_content_prompts_js_1.fieldContentSystemPrompt)(), (0, field_content_prompts_js_1.fieldContentUserPrompt)({
            fieldType: input.fieldType,
            prompt,
            maxChars: effectiveLimits.maxChars,
            minChars: bounds.minChars,
            maxWords: effectiveLimits.maxWords,
            minWords: bounds.minWords,
            currentValue: input.currentValue,
            mode: input.regenerate ? "regenerate" : "generate",
            businessContext: input.businessContext,
        }));
    }
    catch (err) {
        if (err instanceof error_middleware_js_1.AppError && err.code === "AI_TIMEOUT") {
            throw new error_middleware_js_1.AppError("We couldn't generate content right now. Please try again.", 504, "AI_TIMEOUT");
        }
        throw new error_middleware_js_1.AppError("We couldn't generate content right now. Please try again.", 502, "AI_GENERATION_FAILED");
    }
    let rawContent;
    try {
        rawContent = resultSchema.parse(parsed).content;
    }
    catch {
        throw new error_middleware_js_1.AppError("We couldn't generate content right now. Please try again.", 502, "AI_GENERATION_FAILED");
    }
    const completeSentences = (0, field_content_limits_js_1.isProseFieldType)(input.fieldType);
    const limitOpts = { completeSentences };
    const limited = (0, field_content_limits_js_1.enforceFieldContentLimit)(rawContent, effectiveLimits, limitOpts);
    const formatted = (0, field_content_prose_js_1.formatLongFieldContent)(limited, input.fieldType);
    const trimmed = (0, field_content_limits_js_1.enforceFieldContentLimit)(formatted, effectiveLimits, limitOpts);
    const safe = (0, ai_sanitize_js_1.sanitizePlainText)(trimmed, effectiveLimits.maxChars, "content", limitOpts);
    return { content: safe };
}
