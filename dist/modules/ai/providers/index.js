"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMockAiBehavior = exports.setMockAiBehavior = void 0;
exports.setAIProviderForTests = setAIProviderForTests;
exports.getAIProvider = getAIProvider;
const env_js_1 = require("../../../config/env.js");
const error_middleware_js_1 = require("../../../middleware/error.middleware.js");
const mock_provider_js_1 = require("./mock.provider.js");
const openai_provider_js_1 = require("./openai.provider.js");
let overrideProvider = null;
function setAIProviderForTests(provider) {
    overrideProvider = provider;
}
function getAIProvider() {
    if (overrideProvider)
        return overrideProvider;
    if (env_js_1.env.aiProvider === "mock") {
        return new mock_provider_js_1.MockAIProvider();
    }
    if (env_js_1.env.aiProvider === "openai") {
        return new openai_provider_js_1.OpenAIProvider();
    }
    throw new error_middleware_js_1.AppError("AI is not configured", 503, "AI_NOT_CONFIGURED");
}
var mock_provider_js_2 = require("./mock.provider.js");
Object.defineProperty(exports, "setMockAiBehavior", { enumerable: true, get: function () { return mock_provider_js_2.setMockAiBehavior; } });
Object.defineProperty(exports, "getMockAiBehavior", { enumerable: true, get: function () { return mock_provider_js_2.getMockAiBehavior; } });
