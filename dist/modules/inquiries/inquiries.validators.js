"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicWebsiteInquiryParamsSchema = exports.submitInquiryBodySchema = void 0;
const zod_1 = require("zod");
exports.submitInquiryBodySchema = zod_1.z.object({
    name: zod_1.z.string().trim().min(1).max(120),
    email: zod_1.z.string().trim().email().max(254),
    message: zod_1.z.string().trim().min(1).max(5000),
});
exports.publicWebsiteInquiryParamsSchema = zod_1.z.object({
    publicId: zod_1.z.string().trim().min(1).max(32),
});
