"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.templateIdParamSchema = exports.listTemplatesQuerySchema = exports.workspaceTemplatePreviewParamsSchema = void 0;
const zod_1 = require("zod");
const objectIdRegex = /^[a-f\d]{24}$/i;
exports.workspaceTemplatePreviewParamsSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().regex(objectIdRegex, "Invalid workspace ID"),
    templateId: zod_1.z.string().trim().min(1).max(80),
});
exports.listTemplatesQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
    offset: zod_1.z.coerce.number().int().min(0).optional(),
});
exports.templateIdParamSchema = zod_1.z.object({
    templateId: zod_1.z.string().trim().min(1).max(80),
});
