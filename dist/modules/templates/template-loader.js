"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isKnownTemplateId = isKnownTemplateId;
exports.loadTemplateDefinition = loadTemplateDefinition;
exports.clearTemplateCacheForTests = clearTemplateCacheForTests;
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const LOADERS = {
    "ocean-crown": () => import("./catalog/ocean-crown.template.js").then((m) => ({
        oceanCrownTemplate: m.oceanCrownTemplate,
    })),
};
const EXPORT_NAME = {
    "ocean-crown": "oceanCrownTemplate",
};
const cache = new Map();
function isKnownTemplateId(templateId) {
    return templateId in LOADERS;
}
async function loadTemplateDefinition(templateId) {
    const cached = cache.get(templateId);
    if (cached)
        return cached;
    const loader = LOADERS[templateId];
    const exportName = EXPORT_NAME[templateId];
    if (!loader || !exportName) {
        throw new error_middleware_js_1.AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }
    const mod = await loader();
    const definition = mod[exportName];
    if (!definition || definition.id !== templateId) {
        throw new error_middleware_js_1.AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }
    cache.set(templateId, definition);
    return definition;
}
function clearTemplateCacheForTests() {
    cache.clear();
}
