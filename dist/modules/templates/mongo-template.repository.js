"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoTemplateRepository = void 0;
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const env_js_1 = require("../../config/env.js");
const template_cache_js_1 = require("../../cache/template-cache.js");
const templates_model_js_1 = require("./templates.model.js");
const DEFAULT_LIST_LIMIT = 50;
const MAX_LIST_LIMIT = 100;
function definitionCacheKey(templateId, version) {
    return `tpl:def:${templateId}:v${version}`;
}
function docToDefinition(doc) {
    return {
        id: doc.templateId,
        name: doc.name,
        category: doc.category,
        description: doc.description,
        theme: doc.theme,
        pages: doc.pages,
    };
}
function docToSummary(doc) {
    return {
        id: doc.templateId,
        name: doc.name,
        category: doc.category,
        description: doc.description,
        previewThumbnailUrl: doc.previewThumbnailUrl ?? null,
    };
}
class MongoTemplateRepository {
    async list(input) {
        const limit = Math.min(Math.max(input?.limit ?? DEFAULT_LIST_LIMIT, 1), MAX_LIST_LIMIT);
        const offset = Math.max(input?.offset ?? 0, 0);
        const filter = { published: true };
        const [docs, total] = await Promise.all([
            templates_model_js_1.TemplateModel.find(filter)
                .sort({ sortOrder: 1, templateId: 1 })
                .skip(offset)
                .limit(limit)
                .select("templateId name category description previewThumbnailUrl")
                .lean(),
            templates_model_js_1.TemplateModel.countDocuments(filter),
        ]);
        return {
            templates: docs.map(docToSummary),
            total,
            limit,
            offset,
        };
    }
    async getDefinition(templateId) {
        const id = templateId.trim().toLowerCase();
        const meta = await templates_model_js_1.TemplateModel.findOne({ templateId: id, published: true })
            .select("templateId version")
            .lean();
        if (!meta) {
            throw new error_middleware_js_1.AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
        }
        const cache = (0, template_cache_js_1.getTemplateCache)();
        const key = definitionCacheKey(id, meta.version);
        const cached = await cache.get(key);
        if (cached) {
            return JSON.parse(cached);
        }
        const doc = await templates_model_js_1.TemplateModel.findOne({ templateId: id, published: true }).lean();
        if (!doc) {
            throw new error_middleware_js_1.AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
        }
        const definition = docToDefinition(doc);
        await cache.set(key, JSON.stringify(definition), env_js_1.env.templateCacheTtlSeconds);
        return definition;
    }
    async exists(templateId) {
        const id = templateId.trim().toLowerCase();
        const n = await templates_model_js_1.TemplateModel.countDocuments({
            templateId: id,
            published: true,
        });
        return n > 0;
    }
}
exports.MongoTemplateRepository = MongoTemplateRepository;
