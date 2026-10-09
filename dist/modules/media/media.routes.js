"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.mediaRoutes = void 0;
const express_1 = require("express");
const validate_js_1 = require("../../utils/validate.js");
const media_controller_js_1 = require("./media.controller.js");
const media_upload_js_1 = require("./media.upload.js");
const media_validators_js_1 = require("./media.validators.js");
const router = (0, express_1.Router)({ mergeParams: true });
exports.mediaRoutes = router;
function withUpload(req, res, next) {
    (0, media_upload_js_1.uploadSingleImage)(req, res, (err) => {
        if (err) {
            (0, media_upload_js_1.handleMulterError)(err, next);
            return;
        }
        next();
    });
}
router.post("/", withUpload, media_controller_js_1.mediaController.create);
router.get("/", (0, validate_js_1.validateQuery)(media_validators_js_1.listMediaQuerySchema), media_controller_js_1.mediaController.list);
router.get("/:mediaId/content", (0, validate_js_1.validateParams)(media_validators_js_1.mediaIdParamSchema), media_controller_js_1.mediaController.content);
router.get("/:mediaId", (0, validate_js_1.validateParams)(media_validators_js_1.mediaIdParamSchema), media_controller_js_1.mediaController.getOne);
router.patch("/:mediaId", (0, validate_js_1.validateParams)(media_validators_js_1.mediaIdParamSchema), withUpload, media_controller_js_1.mediaController.replace);
router.delete("/:mediaId", (0, validate_js_1.validateParams)(media_validators_js_1.mediaIdParamSchema), media_controller_js_1.mediaController.delete);
