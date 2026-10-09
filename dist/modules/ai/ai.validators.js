"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldContentGenerateBodySchema = exports.composedSectionEditBodySchema = exports.composedSectionRegenerateBodySchema = exports.composedSectionGenerateBodySchema = exports.sectionActionBodySchema = exports.generateWebsiteBodySchema = void 0;
const zod_1 = require("zod");
const pages_constants_js_1 = require("../pages/pages.constants.js");
const composed_section_catalog_js_1 = require("./composed/composed-section.catalog.js");
const composed_layout_presets_js_1 = require("./composed/composed-layout.presets.js");
const field_content_limits_js_1 = require("./content/field-content.limits.js");
const composed_section_schema_js_1 = require("./composed/composed-section.schema.js");
const objectIdRegex = /^[a-f\d]{24}$/i;
exports.generateWebsiteBodySchema = zod_1.z.object({
    businessName: zod_1.z.string().trim().min(1).max(120),
    businessType: zod_1.z.string().trim().min(1).max(120),
    businessDescription: zod_1.z.string().trim().min(1).max(4000),
    location: zod_1.z.string().trim().min(1).max(200),
    services: zod_1.z.array(zod_1.z.string().trim().min(1).max(120)).min(1).max(30),
    websiteStyle: zod_1.z.string().trim().min(1).max(500),
});
exports.sectionActionBodySchema = zod_1.z
    .object({
    action: zod_1.z.enum([
        "generate",
        "rewrite",
        "shorten",
        "professional",
        "generate_about",
        "generate_services",
        "generate_faqs",
        "create_from_prompt",
        "edit_from_prompt",
        "seo_title",
        "seo_description",
    ]),
    websiteId: zod_1.z.string().regex(objectIdRegex),
    pageId: zod_1.z.string().regex(objectIdRegex),
    sectionId: zod_1.z.string().regex(objectIdRegex).optional(),
    sectionType: zod_1.z.enum(pages_constants_js_1.SECTION_TYPES).optional(),
    content: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    settings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    prompt: zod_1.z.string().trim().min(1).max(2000).optional(),
    businessContext: zod_1.z
        .object({
        businessName: zod_1.z.string().trim().max(120).optional(),
        businessType: zod_1.z.string().trim().max(120).optional(),
        businessDescription: zod_1.z.string().trim().max(4000).optional(),
        location: zod_1.z.string().trim().max(200).optional(),
        services: zod_1.z.array(zod_1.z.string().trim().max(120)).max(30).optional(),
        websiteStyle: zod_1.z.string().trim().max(500).optional(),
    })
        .optional(),
})
    .superRefine((data, ctx) => {
    const seo = data.action === "seo_title" || data.action === "seo_description";
    const create = data.action === "create_from_prompt";
    const editPrompt = data.action === "edit_from_prompt";
    if (create && !data.prompt) {
        ctx.addIssue({
            code: "custom",
            message: "prompt is required for create_from_prompt",
            path: ["prompt"],
        });
    }
    if (editPrompt && !data.prompt) {
        ctx.addIssue({
            code: "custom",
            message: "prompt is required for edit_from_prompt",
            path: ["prompt"],
        });
    }
    if (seo || create)
        return;
    if (!data.sectionType) {
        ctx.addIssue({
            code: "custom",
            message: "sectionType is required for this action",
            path: ["sectionType"],
        });
    }
    if (!data.sectionId) {
        ctx.addIssue({
            code: "custom",
            message: "sectionId is required for section actions",
            path: ["sectionId"],
        });
    }
});
const businessContextSchema = zod_1.z
    .object({
    businessName: zod_1.z.string().trim().max(120).optional(),
    businessType: zod_1.z.string().trim().max(120).optional(),
    businessDescription: zod_1.z.string().trim().max(4000).optional(),
    location: zod_1.z.string().trim().max(200).optional(),
    services: zod_1.z.array(zod_1.z.string().trim().max(120)).max(30).optional(),
    websiteStyle: zod_1.z.string().trim().max(500).optional(),
})
    .optional();
const composedSectionBaseSchema = zod_1.z.object({
    websiteId: zod_1.z.string().regex(objectIdRegex),
    pageId: zod_1.z.string().regex(objectIdRegex),
    prompt: zod_1.z.string().trim().min(1).max(8000),
    sectionTypeHint: zod_1.z.enum(composed_section_catalog_js_1.COMPOSED_SECTION_TYPE_HINTS).optional(),
    designStyle: zod_1.z.enum(composed_section_catalog_js_1.COMPOSED_DESIGN_STYLES).optional(),
    additionalRequirements: zod_1.z.array(zod_1.z.string().trim().max(200)).max(20).optional(),
    layoutPresetId: zod_1.z.enum(composed_layout_presets_js_1.COMPOSED_LAYOUT_PRESET_IDS).optional(),
    businessContext: businessContextSchema,
});
exports.composedSectionGenerateBodySchema = composedSectionBaseSchema;
exports.composedSectionRegenerateBodySchema = composedSectionBaseSchema.extend({
    currentSection: composed_section_schema_js_1.composedSectionDefinitionSchema,
});
exports.composedSectionEditBodySchema = exports.composedSectionRegenerateBodySchema;
exports.fieldContentGenerateBodySchema = zod_1.z.object({
    prompt: zod_1.z.string().trim().min(1).max(4000),
    fieldType: zod_1.z.enum(field_content_limits_js_1.FIELD_CONTENT_TYPES),
    maxChars: zod_1.z.number().int().min(1).max(8000).optional(),
    maxWords: zod_1.z.number().int().min(1).max(800).optional(),
    currentValue: zod_1.z.string().max(8000).optional(),
    regenerate: zod_1.z.boolean().optional(),
    businessContext: businessContextSchema,
});
