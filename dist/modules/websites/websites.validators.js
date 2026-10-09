"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.websiteIdParamSchema = exports.updateWebsiteSchema = exports.createWebsiteSchema = void 0;
const zod_1 = require("zod");
const websites_model_js_1 = require("./websites.model.js");
const objectIdRegex = /^[a-f\d]{24}$/i;
exports.createWebsiteSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Name is required").max(120),
    description: zod_1.z.string().trim().max(2000).optional(),
    templateId: zod_1.z.string().trim().min(1).max(80).optional(),
});
const themeSchema = zod_1.z
    .object({
    colors: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    typography: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
    buttons: zod_1.z.record(zod_1.z.string(), zod_1.z.string()).optional(),
})
    .optional();
exports.updateWebsiteSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).max(120).optional(),
    description: zod_1.z.string().trim().max(2000).nullable().optional(),
    status: zod_1.z.enum(websites_model_js_1.WEBSITE_STATUSES).optional(),
    theme: themeSchema,
})
    .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
});
exports.websiteIdParamSchema = zod_1.z.object({
    websiteId: zod_1.z.string().regex(objectIdRegex, "Invalid website ID"),
});
