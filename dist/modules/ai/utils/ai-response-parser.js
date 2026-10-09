"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseJsonFromModelText = parseJsonFromModelText;
const error_middleware_js_1 = require("../../../middleware/error.middleware.js");
const MAX_JSON_CHARS = 200_000;
function parseJsonFromModelText(text) {
    const trimmed = text.trim();
    if (trimmed.length > MAX_JSON_CHARS) {
        throw new error_middleware_js_1.AppError("AI response too large", 400, "AI_INVALID_RESPONSE");
    }
    let candidate = trimmed;
    const fence = /^```(?:json)?\s*([\s\S]*?)```$/i.exec(trimmed);
    if (fence) {
        candidate = fence[1].trim();
    }
    try {
        return JSON.parse(candidate);
    }
    catch {
        throw new error_middleware_js_1.AppError("AI returned invalid JSON", 400, "AI_INVALID_RESPONSE");
    }
}
