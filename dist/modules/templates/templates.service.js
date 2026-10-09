"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplates = listTemplates;
exports.getTemplateById = getTemplateById;
exports.getTemplatePreviewForWorkspace = getTemplatePreviewForWorkspace;
exports.applyTemplateToWebsite = applyTemplateToWebsite;
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const template_cache_js_1 = require("../../cache/template-cache.js");
const apply_business_profile_js_1 = require("../workspaces/apply-business-profile.js");
const workspaces_service_js_1 = require("../workspaces/workspaces.service.js");
const pages_seed_js_1 = require("../pages/pages.seed.js");
const websites_service_js_1 = require("../websites/websites.service.js");
const websites_model_js_1 = require("../websites/websites.model.js");
const websites_types_js_1 = require("../websites/websites.types.js");
const mongoose_1 = require("mongoose");
const template_repository_js_1 = require("./template.repository.js");
const template_preview_cache_js_1 = require("./template-preview-cache.js");
async function listTemplates(input) {
    return (0, template_repository_js_1.getTemplateRepository)().list(input);
}
async function getTemplateById(templateId) {
    const template = await (0, template_repository_js_1.getTemplateRepository)().getDefinition(templateId);
    return {
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        theme: template.theme,
        pages: template.pages,
    };
}
async function getTemplatePreviewForWorkspace(workspaceId, templateId) {
    const businessProfile = await (0, workspaces_service_js_1.getWorkspaceBusinessProfile)(workspaceId);
    const cache = (0, template_cache_js_1.getTemplateCache)();
    const cacheKey = (0, template_preview_cache_js_1.previewCacheKey)(workspaceId, templateId, businessProfile);
    const cached = await cache.get(cacheKey);
    if (cached) {
        return JSON.parse(cached);
    }
    const template = await (0, template_repository_js_1.getTemplateRepository)().getDefinition(templateId);
    const pages = (0, apply_business_profile_js_1.applyBusinessProfileToSeedPages)(template.pages, businessProfile);
    const home = pages.find((p) => p.slug === "home") ??
        pages.find((p) => p.pageType === "HOME") ??
        pages[0];
    if (!home) {
        throw new error_middleware_js_1.AppError("Template has no pages", 404, "TEMPLATE_NOT_FOUND");
    }
    const applied = Boolean(businessProfile.businessName?.trim());
    const payload = {
        template: {
            id: template.id,
            name: template.name,
            category: template.category,
            description: template.description,
        },
        theme: template.theme,
        businessProfileApplied: applied,
        businessProfile,
        page: {
            name: home.name,
            slug: home.slug,
            pageType: home.pageType ?? "CUSTOM",
            seo: {
                title: home.seo?.title ?? null,
                metaDescription: home.seo?.metaDescription ?? null,
                socialImage: home.seo?.socialImage ?? null,
            },
            sections: home.sections.map((section, index) => ({
                id: `tpl-preview-${index}`,
                type: section.type,
                order: section.order,
                data: section.data,
                settings: section.settings,
            })),
        },
    };
    await cache.set(cacheKey, JSON.stringify(payload), template_preview_cache_js_1.PREVIEW_CACHE_TTL_SECONDS);
    return payload;
}
async function applyTemplateToWebsite(workspaceId, websiteId, templateId) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const template = await (0, template_repository_js_1.getTemplateRepository)().getDefinition(templateId);
    const businessProfile = await (0, workspaces_service_js_1.getWorkspaceBusinessProfile)(workspaceId);
    const pages = (0, apply_business_profile_js_1.applyBusinessProfileToSeedPages)(template.pages, businessProfile);
    await (0, pages_seed_js_1.seedWebsiteContent)(workspaceId, websiteId, {
        theme: template.theme,
        pages,
    });
    const website = await websites_model_js_1.WebsiteModel.findOne({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    });
    if (!website) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    const { computeHasUnpublishedChanges } = await import("../websites/websites.service.js");
    const hasUnpublishedChanges = await computeHasUnpublishedChanges(website);
    return (0, websites_types_js_1.toPublicWebsite)(website, { hasUnpublishedChanges });
}
