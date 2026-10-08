"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notImplementedHandler = notImplementedHandler;
const error_middleware_js_1 = require("../middleware/error.middleware.js");
function notImplementedHandler(_req, _res, next) {
    next(new error_middleware_js_1.AppError("Not implemented", 501, "NOT_IMPLEMENTED"));
}
