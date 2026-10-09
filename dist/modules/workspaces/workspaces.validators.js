"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceIdParamSchema = exports.updateWorkspaceSchema = exports.businessProfileSchema = exports.createWorkspaceSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[a-f\d]{24}$/i;
exports.createWorkspaceSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1, "Name is required").max(120),
    slug: zod_1.z
        .string()
        .trim()
        .toLowerCase()
        .min(2)
        .max(64)
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
        .optional(),
});
const optionalUrl = zod_1.z
    .string()
    .trim()
    .max(2048)
    .optional()
    .or(zod_1.z.literal(""));
exports.businessProfileSchema = zod_1.z.object({
    businessName: zod_1.z.string().trim().max(120).optional(),
    tagline: zod_1.z.string().trim().max(200).optional(),
    logoUrl: zod_1.z.string().trim().max(2048).nullable().optional(),
    phone: zod_1.z.string().trim().max(40).optional(),
    email: zod_1.z.union([zod_1.z.string().trim().email().max(200), zod_1.z.literal("")]).optional(),
    address: zod_1.z.string().trim().max(500).optional(),
    socialTwitter: optionalUrl,
    socialFacebook: optionalUrl,
    socialInstagram: optionalUrl,
    socialLinkedin: optionalUrl,
});
exports.updateWorkspaceSchema = zod_1.z
    .object({
    name: zod_1.z.string().trim().min(1).max(120).optional(),
    businessProfile: exports.businessProfileSchema.optional(),
})
    .refine((data) => data.name !== undefined || data.businessProfile !== undefined, {
    message: "At least one field is required",
});
exports.workspaceIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().regex(objectIdRegex, "Invalid workspace ID"),
});
