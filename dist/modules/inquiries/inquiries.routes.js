"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.workspaceInquiriesRoutes = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const validate_js_1 = require("../../utils/validate.js");
const inquiries_controller_js_1 = require("./inquiries.controller.js");
const inquiries_validators_js_1 = require("./inquiries.validators.js");
const objectIdRegex = /^[a-f\d]{24}$/i;
const workspaceSubmitSchema = inquiries_validators_js_1.submitInquiryBodySchema.extend({
    websiteId: zod_1.z.preprocess((val) => {
        if (val === null || val === undefined)
            return undefined;
        if (typeof val !== "string")
            return val;
        const trimmed = val.trim();
        return trimmed.length === 0 ? undefined : trimmed;
    }, zod_1.z.string().regex(objectIdRegex, "Invalid website ID").optional()),
});
const router = (0, express_1.Router)({ mergeParams: true });
exports.workspaceInquiriesRoutes = router;
router.post("/", (0, validate_js_1.validateBody)(workspaceSubmitSchema), inquiries_controller_js_1.inquiriesController.workspace);
