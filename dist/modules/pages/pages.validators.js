"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reorderSectionsSchema = exports.updateSectionSchema = exports.createSectionSchema = exports.updatePageSchema = exports.createPageSchema = exports.sectionIdParamSchema = exports.pageAndWebsiteParamSchema = exports.pageIdParamSchema = void 0;
const zod_1 = require("zod");
const pages_model_js_1 = require("./pages.model.js");
const pages_constants_js_1 = require("./pages.constants.js");
const objectIdRegex = /^[a-f\d]{24}$/i;
exports.pageIdParamSchema = zod_1.z.object({
    pageId: zod_1.z.string().regex(objectIdRegex, "Invalid page ID"),
});
exports.pageAndWebsiteParamSchema = zod_1.z.object({
    websiteId: zod_1.z.string().regex(objectIdRegex, "Invalid website ID"),
    pageId: zod_1.z.string().regex(objectIdRegex, "Invalid page ID"),
});
exports.sectionIdParamSchema = exports.pageAndWebsiteParamSchema.extend({
    sectionId: zod_1.z.string().regex(objectIdRegex, "Invalid section ID"),
});
const seoSchema = zod_1.z.object({
    title: zod_1.z.string().trim().max(120).nullable().optional(),
    metaDescription: zod_1.z.string().trim().max(320).nullable().optional(),
    socialImage: zod_1.z.string().trim().max(2048).nullable().optional(),
});
exports.createPageSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Name is required").max(120),
    slug: zod_1.z.string().trim().min(1).max(80).optional(),
    pageType: zod_1.z.enum(pages_model_js_1.PAGE_TYPES).optional(),
    seo: seoSchema.optional(),
});
exports.updatePageSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).max(120).optional(),
    slug: zod_1.z.string().trim().min(1).max(80).optional(),
    pageType: zod_1.z.enum(pages_model_js_1.PAGE_TYPES).optional(),
    status: zod_1.z.enum(pages_model_js_1.PAGE_STATUSES).optional(),
    seo: seoSchema.optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});
exports.createSectionSchema = zod_1.z.object({
    type: zod_1.z.enum(pages_constants_js_1.SECTION_TYPES),
    order: zod_1.z.number().int().min(0).optional(),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    settings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
exports.updateSectionSchema = zod_1.z
    .object({
    type: zod_1.z.enum(pages_constants_js_1.SECTION_TYPES).optional(),
    order: zod_1.z.number().int().min(0).optional(),
    data: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
    settings: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});
exports.reorderSectionsSchema = zod_1.z.object({
    sectionIds: zod_1.z
        .array(zod_1.z.string().regex(objectIdRegex, "Invalid section ID"))
        .min(1),
});
