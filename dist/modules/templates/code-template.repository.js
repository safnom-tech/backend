"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodeTemplateRepository = void 0;
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const template_manifest_js_1 = require("./template.manifest.js");
const template_loader_js_1 = require("./template-loader.js");
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;
class CodeTemplateRepository {
    async list(input) {
        const total = template_manifest_js_1.TEMPLATE_MANIFEST.length;
        const limit = Math.min(Math.max(input?.limit ?? DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);
        const offset = Math.max(input?.offset ?? 0, 0);
        const templates = template_manifest_js_1.TEMPLATE_MANIFEST.slice(offset, offset + limit);
        return { templates, total, limit, offset };
    }
    async getDefinition(templateId) {
        return (0, template_loader_js_1.loadTemplateDefinition)(templateId);
    }
    async exists(templateId) {
        try {
            await (0, template_loader_js_1.loadTemplateDefinition)(templateId);
            return true;
        }
        catch (error) {
            if (error instanceof error_middleware_js_1.AppError && error.code === "TEMPLATE_NOT_FOUND") {
                return false;
            }
            throw error;
        }
    }
}
exports.CodeTemplateRepository = CodeTemplateRepository;
