"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundMiddleware = notFoundMiddleware;
const apiResponse_js_1 = require("../utils/apiResponse.js");
function notFoundMiddleware(_req, res) {
    (0, apiResponse_js_1.sendError)(res, "Route not found", { code: "NOT_FOUND" }, 404);
}
