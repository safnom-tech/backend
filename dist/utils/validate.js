"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateBody = validateBody;
exports.validateParams = validateParams;
exports.validateQuery = validateQuery;
const error_middleware_js_1 = require("../middleware/error.middleware.js");
function validateBody(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const message = result.error.issues.map((e) => e.message).join("; ");
            next(new error_middleware_js_1.AppError(message || "Validation failed", 400, "VALIDATION_ERROR"));
            return;
        }
        req.body = result.data;
        next();
    };
}
function validateParams(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            const message = result.error.issues.map((e) => e.message).join("; ");
            next(new error_middleware_js_1.AppError(message || "Validation failed", 400, "VALIDATION_ERROR"));
            return;
        }
        Object.assign(req.params, result.data);
        next();
    };
}
function validateQuery(schema) {
    return (req, _res, next) => {
        const result = schema.safeParse(req.query);
        if (!result.success) {
            const message = result.error.issues.map((e) => e.message).join("; ");
            next(new error_middleware_js_1.AppError(message || "Validation failed", 400, "VALIDATION_ERROR"));
            return;
        }
        req.query = result.data;
        next();
    };
}
