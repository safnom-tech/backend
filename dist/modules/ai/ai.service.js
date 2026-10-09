"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateWebsiteFromAi = generateWebsiteFromAi;
exports.runSectionAction = runSectionAction;
const logger_js_1 = require("../../utils/logger.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const pages_service_js_1 = require("../pages/pages.service.js");
const pages_service_js_2 = require("../pages/pages.service.js");
const pages_seed_js_1 = require("../pages/pages.seed.js");
const websites_service_js_1 = require("../websites/websites.service.js");
const ai_validation_js_1 = require("./ai.validation.js");
const composed_section_service_js_1 = require("./composed/composed-section.service.js");
const ai_prompts_js_1 = require("./ai.prompts.js");
const index_js_1 = require("./providers/index.js");
const ai_response_parser_js_1 = require("./utils/ai-response-parser.js");
function effectiveSectionType(action, sectionType) {
    if (action === "generate_about")
        return "TEXT";
    if (action === "generate_services")
        return "SERVICES";
    if (action === "generate_faqs")
        return "FAQ";
    if (!sectionType) {
        throw new error_middleware_js_1.AppError("sectionType is required", 400, "VALIDATION_ERROR");
    }
    return sectionType;
}
async function completeJsonOnce(systemPrompt, userPrompt) {
    const provider = (0, index_js_1.getAIProvider)();
    const raw = await provider.completeJson({ systemPrompt, userPrompt });
    if (typeof raw === "string") {
        return (0, ai_response_parser_js_1.parseJsonFromModelText)(raw);
    }
    return raw;
}
async function completeJsonWithRetry(systemPrompt, userPrompt) {
    try {
        return await completeJsonOnce(systemPrompt, userPrompt);
    }
    catch (err) {
        const retryable = err instanceof error_middleware_js_1.AppError &&
            err.code === "AI_PROVIDER_ERROR";
        if (!retryable)
            throw err;
        return await completeJsonOnce(systemPrompt, userPrompt);
    }
}
function logAiOp(meta, success, started) {
    logger_js_1.logger.info({
        ...meta,
        success,
        durationMs: Date.now() - started,
    }, "ai_operation");
}
async function generateWebsiteFromAi(workspaceId, input) {
    const started = Date.now();
    const meta = { action: "website_generate", workspaceId, provider: (0, index_js_1.getAIProvider)().name };
    try {
        const parsed = await completeJsonWithRetry((0, ai_prompts_js_1.websiteDraftSystemPrompt)(), (0, ai_prompts_js_1.websiteDraftUserPrompt)(input));
        const draft = (0, ai_validation_js_1.normalizeWebsiteDraft)(ai_validation_js_1.aiWebsiteDraftSchema.parse(parsed));
        const website = await (0, websites_service_js_1.createWebsite)(workspaceId, {
            name: draft.website.name,
            description: draft.website.description ?? undefined,
        });
        try {
            await (0, pages_seed_js_1.seedWebsiteContent)(workspaceId, website.id, {
                theme: draft.theme,
                pages: draft.pages,
            });
        }
        catch (seedErr) {
            try {
                await (0, websites_service_js_1.deleteWebsite)(workspaceId, website.id);
            }
            catch {
                /* best effort */
            }
            throw seedErr;
        }
        const pages = await (0, pages_service_js_2.listPagesForWebsite)(workspaceId, website.id);
        logAiOp(meta, true, started);
        return { website, pages };
    }
    catch (err) {
        logAiOp(meta, false, started);
        throw err;
    }
}
async function runSectionAction(workspaceId, input) {
    const started = Date.now();
    const meta = {
        action: input.action,
        workspaceId,
        websiteId: input.websiteId,
        pageId: input.pageId,
        sectionId: input.sectionId,
        provider: (0, index_js_1.getAIProvider)().name,
    };
    try {
        const page = await (0, pages_service_js_1.assertPageInWebsite)(workspaceId, input.websiteId, input.pageId);
        if (input.action === "create_from_prompt") {
            const composed = await (0, composed_section_service_js_1.generateComposedSection)(workspaceId, {
                websiteId: input.websiteId,
                pageId: input.pageId,
                prompt: input.prompt ?? "",
                businessContext: input.businessContext,
            });
            logAiOp(meta, true, started);
            return {
                type: composed.type,
                data: composed.data,
                settings: composed.settings,
            };
        }
        if (input.action === "seo_title" || input.action === "seo_description") {
            const parsed = await completeJsonWithRetry((0, ai_prompts_js_1.seoActionSystemPrompt)(input.action), (0, ai_prompts_js_1.seoActionUserPrompt)({
                action: input.action,
                pageName: page.name,
                businessContext: input.businessContext,
                currentSeo: page.seo,
            }));
            const result = ai_validation_js_1.aiSeoResultSchema.parse(parsed);
            logAiOp(meta, true, started);
            return { seo: result.seo };
        }
        const type = effectiveSectionType(input.action, input.sectionType);
        if (input.sectionId) {
            const section = page.sections.find((s) => s.id === input.sectionId);
            if (!section) {
                throw new error_middleware_js_1.AppError("Section not found", 404, "SECTION_NOT_FOUND");
            }
            if (section.type !== type && input.action !== "generate") {
                throw new error_middleware_js_1.AppError("Section type mismatch", 400, "VALIDATION_ERROR");
            }
        }
        let content = input.content;
        let settings = input.settings;
        if (input.sectionId) {
            const section = page.sections.find((s) => s.id === input.sectionId);
            if (section) {
                content = content ?? section.data;
                settings = settings ?? section.settings ?? {};
            }
        }
        const parsed = await completeJsonWithRetry((0, ai_prompts_js_1.sectionActionSystemPrompt)(input.action, type), (0, ai_prompts_js_1.sectionActionUserPrompt)({
            action: input.action,
            sectionType: type,
            content,
            settings,
            prompt: input.prompt,
            businessContext: input.businessContext,
        }));
        const result = ai_validation_js_1.aiSectionResultSchema.parse(parsed);
        const data = (0, ai_validation_js_1.validateSectionData)(type, result.data);
        logAiOp(meta, true, started);
        return { data, settings: result.settings ?? {} };
    }
    catch (err) {
        logAiOp(meta, false, started);
        throw err;
    }
}
