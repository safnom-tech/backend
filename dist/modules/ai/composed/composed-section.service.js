"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runComposedSectionGeneration = runComposedSectionGeneration;
exports.generateComposedSection = generateComposedSection;
exports.regenerateComposedSection = regenerateComposedSection;
exports.editComposedSection = editComposedSection;
const error_middleware_js_1 = require("../../../middleware/error.middleware.js");
const pages_service_js_1 = require("../../pages/pages.service.js");
const websites_service_js_1 = require("../../websites/websites.service.js");
const ai_validation_js_1 = require("../ai.validation.js");
const index_js_1 = require("../providers/index.js");
const ai_response_parser_js_1 = require("../utils/ai-response-parser.js");
const composed_section_context_js_1 = require("./composed-section.context.js");
const composed_section_prompts_js_1 = require("./composed-section.prompts.js");
const composed_section_schema_js_1 = require("./composed-section.schema.js");
const composed_preset_content_merge_js_1 = require("./composed-preset-content-merge.js");
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
        const retryable = err instanceof error_middleware_js_1.AppError && err.code === "AI_PROVIDER_ERROR";
        if (!retryable)
            throw err;
        return await completeJsonOnce(systemPrompt, userPrompt);
    }
}
async function runComposedSectionGeneration(workspaceId, input, mode) {
    const prompt = input.prompt?.trim();
    if (!prompt) {
        throw new error_middleware_js_1.AppError("prompt is required", 400, "VALIDATION_ERROR");
    }
    const page = await (0, pages_service_js_1.assertPageInWebsite)(workspaceId, input.websiteId, input.pageId);
    const website = await (0, websites_service_js_1.getWebsite)(workspaceId, input.websiteId);
    const currentSection = input.currentSection
        ? (0, composed_section_schema_js_1.normalizeComposedSection)(input.currentSection)
        : null;
    if ((mode === "regenerate" || mode === "edit") && !currentSection) {
        throw new error_middleware_js_1.AppError("currentSection is required for this action", 400, "VALIDATION_ERROR");
    }
    const userPrompt = (0, composed_section_prompts_js_1.composedSectionUserPrompt)({
        mode,
        prompt,
        sectionTypeHint: input.sectionTypeHint,
        designStyle: input.designStyle,
        additionalRequirements: input.additionalRequirements,
        layoutPresetId: input.layoutPresetId,
        pageName: page.name,
        pageSlug: page.slug,
        websiteSummary: (0, composed_section_context_js_1.buildWebsiteSummary)(website, input.businessContext),
        designSystem: (0, composed_section_context_js_1.buildDesignSystemContext)(website),
        pageStructureSummary: (0, composed_section_context_js_1.summarizePageSections)(page),
        currentSection,
    });
    let parsed;
    try {
        parsed = await completeJsonWithRetry((0, composed_section_prompts_js_1.composedSectionSystemPrompt)(mode), userPrompt);
    }
    catch (err) {
        if (err instanceof error_middleware_js_1.AppError) {
            if (err.code === "AI_TIMEOUT") {
                throw new error_middleware_js_1.AppError("We couldn't generate the section right now. Please try again.", 504, "AI_TIMEOUT");
            }
            if (err.code === "AI_PROVIDER_ERROR" || err.code === "AI_INVALID_JSON") {
                throw new error_middleware_js_1.AppError("We couldn't generate the section right now. Please try again.", 502, "AI_GENERATION_FAILED");
            }
        }
        throw err;
    }
    let section;
    try {
        const result = composed_section_schema_js_1.aiComposedSectionResponseSchema.parse(parsed);
        let parsedSection = (0, composed_section_schema_js_1.normalizeComposedSection)(result.section);
        if (mode === "generate" && input.layoutPresetId) {
            parsedSection = (0, composed_section_schema_js_1.normalizeComposedSection)((0, composed_preset_content_merge_js_1.applyPresetDesignWithAiContent)(input.layoutPresetId, prompt, parsedSection));
        }
        section = parsedSection;
    }
    catch {
        throw new error_middleware_js_1.AppError("We couldn't generate the section right now. Please try again.", 502, "AI_GENERATION_FAILED");
    }
    const data = (0, ai_validation_js_1.validateSectionData)("COMPOSED", (0, composed_section_schema_js_1.composedSectionToPageData)(section));
    return {
        section: data.section ?? section,
        type: "COMPOSED",
        data,
        settings: { aiGenerated: true, semanticType: section.semanticType },
    };
}
async function generateComposedSection(workspaceId, input) {
    return runComposedSectionGeneration(workspaceId, input, "generate");
}
async function regenerateComposedSection(workspaceId, input) {
    return runComposedSectionGeneration(workspaceId, input, "regenerate");
}
async function editComposedSection(workspaceId, input) {
    return runComposedSectionGeneration(workspaceId, input, "edit");
}
