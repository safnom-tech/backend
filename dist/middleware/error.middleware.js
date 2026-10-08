"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorMiddleware = errorMiddleware;
const env_js_1 = require("../config/env.js");
const logger_js_1 = require("../utils/logger.js");
class AppError extends Error {
    statusCode;
    code;
    constructor(message, statusCode = 500, code = "INTERNAL_SERVER_ERROR") {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
function errorMiddleware(err, _req, res, _next) {
    if (err instanceof AppError) {
        const body = {
            success: false,
            message: err.message,
            error: {
                code: err.code,
                ...(!env_js_1.env.isProduction && { details: err.message }),
            },
        };
        res.status(err.statusCode).json(body);
        return;
    }
    logger_js_1.logger.error({ err }, "Unhandled application error");
    const body = {
        success: false,
        message: env_js_1.env.isProduction ? "Something went wrong" : err.message,
        error: {
            code: "INTERNAL_SERVER_ERROR",
            ...(!env_js_1.env.isProduction && { details: err.message }),
        },
    };
    res.status(500).json(body);
}
