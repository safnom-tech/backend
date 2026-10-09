"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIProvider = void 0;
const env_js_1 = require("../../../config/env.js");
const error_middleware_js_1 = require("../../../middleware/error.middleware.js");
const ai_response_parser_js_1 = require("../utils/ai-response-parser.js");
class OpenAIProvider {
    name = "openai";
    async completeJson(input) {
        if (!env_js_1.env.aiApiKey) {
            throw new error_middleware_js_1.AppError("AI is not configured", 503, "AI_NOT_CONFIGURED");
        }
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), env_js_1.env.aiTimeoutMs);
        try {
            const res = await fetch(`${env_js_1.env.aiBaseUrl.replace(/\/$/, "")}/chat/completions`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${env_js_1.env.aiApiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: env_js_1.env.aiModel,
                    temperature: 0.4,
                    response_format: { type: "json_object" },
                    messages: [
                        { role: "system", content: input.systemPrompt },
                        { role: "user", content: input.userPrompt },
                    ],
                }),
                signal: controller.signal,
            });
            if (res.status === 429) {
                throw new error_middleware_js_1.AppError("AI service is temporarily busy. Please try again.", 503, "AI_RATE_LIMITED");
            }
            if (!res.ok) {
                throw new error_middleware_js_1.AppError("AI provider request failed", 502, "AI_PROVIDER_ERROR");
            }
            const body = (await res.json());
            const text = body.choices?.[0]?.message?.content ?? "";
            return (0, ai_response_parser_js_1.parseJsonFromModelText)(text);
        }
        catch (err) {
            if (err instanceof error_middleware_js_1.AppError)
                throw err;
            if (err instanceof Error && err.name === "AbortError") {
                throw new error_middleware_js_1.AppError("AI request timed out", 504, "AI_TIMEOUT");
            }
            throw new error_middleware_js_1.AppError("AI provider request failed", 502, "AI_PROVIDER_ERROR");
        }
        finally {
            clearTimeout(timer);
        }
    }
}
exports.OpenAIProvider = OpenAIProvider;
