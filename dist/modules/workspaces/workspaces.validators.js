"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceIdParamSchema = exports.updateWorkspaceSchema = exports.createWorkspaceSchema = void 0;
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
exports.updateWorkspaceSchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
});
exports.workspaceIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().regex(objectIdRegex, "Invalid workspace ID"),
});
