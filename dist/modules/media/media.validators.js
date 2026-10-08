"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMediaQuerySchema = exports.mediaIdParamSchema = void 0;
const zod_1 = require("zod");
exports.mediaIdParamSchema = zod_1.z.object({
    workspaceId: zod_1.z.string().min(1),
    mediaId: zod_1.z.string().min(1),
});
exports.listMediaQuerySchema = zod_1.z.object({
    limit: zod_1.z.coerce.number().int().min(1).max(100).optional(),
});
