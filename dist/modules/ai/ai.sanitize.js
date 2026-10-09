"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizePlainText = sanitizePlainText;
exports.sanitizeUrlField = sanitizeUrlField;
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const field_content_limits_js_1 = require("./content/field-content.limits.js");
const UNSAFE_PATTERNS = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<\/?iframe/i,
];
function sanitizePlainText(value, maxLen, field = "text", options) {
    let s = value.trim();
    if (s.length > maxLen) {
        s = (0, field_content_limits_js_1.enforceFieldContentLimit)(s, { maxChars: maxLen }, { completeSentences: options?.completeSentences });
    }
    for (const re of UNSAFE_PATTERNS) {
        if (re.test(s)) {
            throw new error_middleware_js_1.AppError(`Unsafe content in ${field}`, 400, "VALIDATION_ERROR");
        }
    }
    return s;
}
function sanitizeUrlField(value, field) {
    const s = value.trim().slice(0, 2048);
    if (!s)
        return "";
    if (s.startsWith("#"))
        return sanitizePlainText(s, 256, field);
    if (s.startsWith("http://") || s.startsWith("https://")) {
        return sanitizePlainText(s, 2048, field);
    }
    throw new error_middleware_js_1.AppError(`Invalid URL in ${field}`, 400, "VALIDATION_ERROR");
}
