"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicSiteQuerySchema = exports.publicSubdomainParamSchema = exports.updateSubdomainBodySchema = exports.publishBodySchema = exports.publishingParamsSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[a-f\d]{24}$/i;
exports.publishingParamsSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().regex(objectIdRegex, "Invalid workspace ID"),
    websiteId: zod_1.z.string().regex(objectIdRegex, "Invalid website ID"),
});
exports.publishBodySchema = zod_1.z.object({
    subdomain: zod_1.z.string().trim().min(1).max(64).optional(),
});
exports.updateSubdomainBodySchema = zod_1.z.object({
    subdomain: zod_1.z.string().trim().min(1).max(64),
});
exports.publicSubdomainParamSchema = zod_1.z.object({
    subdomain: zod_1.z.string().trim().min(1).max(64),
});
exports.publicSiteQuerySchema = zod_1.z.object({
    pageSlug: zod_1.z.string().trim().min(1).max(120).optional(),
    slug: zod_1.z.string().trim().min(1).max(120).optional(),
});
