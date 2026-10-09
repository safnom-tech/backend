"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listTemplates = listTemplates;
exports.getTemplateById = getTemplateById;
exports.applyTemplateToWebsite = applyTemplateToWebsite;
const mongoose_1 = require("mongoose");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const pages_model_js_1 = require("../pages/pages.model.js");
const websites_service_js_1 = require("../websites/websites.service.js");
const websites_model_js_1 = require("../websites/websites.model.js");
const websites_types_js_1 = require("../websites/websites.types.js");
const templates_catalog_js_1 = require("./templates.catalog.js");
function listTemplates() {
    return templates_catalog_js_1.TEMPLATE_CATALOG.map(({ id, name, category, description }) => ({
        id,
        name,
        category,
        description,
    }));
}
function getTemplateById(templateId) {
    const template = findTemplate(templateId);
    return {
        id: template.id,
        name: template.name,
        category: template.category,
        description: template.description,
        theme: template.theme,
        pages: template.pages,
    };
}
function findTemplate(templateId) {
    const template = templates_catalog_js_1.TEMPLATE_CATALOG.find((t) => t.id === templateId);
    if (!template) {
        throw new error_middleware_js_1.AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    }
    return template;
}
async function applyTemplateToWebsite(workspaceId, websiteId, templateId) {
    await (0, websites_service_js_1.assertWebsiteInWorkspace)(workspaceId, websiteId);
    const template = findTemplate(templateId);
    await websites_model_js_1.WebsiteModel.updateOne({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    }, {
        $set: {
            theme: template.theme,
        },
    });
    for (const pageDef of template.pages) {
        const sections = pageDef.sections.map((s) => ({
            _id: new mongoose_1.Types.ObjectId(),
            type: s.type,
            order: s.order,
            data: { ...s.data },
            settings: { ...s.settings },
        }));
        await pages_model_js_1.PageModel.create({
            workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
            websiteId: new mongoose_1.Types.ObjectId(websiteId),
            name: pageDef.name,
            slug: pageDef.slug,
            pageType: pageDef.pageType,
            status: "DRAFT",
            seo: {
                title: pageDef.seo?.title ?? null,
                metaDescription: pageDef.seo?.metaDescription ?? null,
                socialImage: pageDef.seo?.socialImage ?? null,
            },
            sections,
        });
    }
    const website = await websites_model_js_1.WebsiteModel.findOne({
        _id: new mongoose_1.Types.ObjectId(websiteId),
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    });
    if (!website) {
        throw new error_middleware_js_1.AppError("Website not found", 404, "WEBSITE_NOT_FOUND");
    }
    return (0, websites_types_js_1.toPublicWebsite)(website);
}
