"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendSuccess = sendSuccess;
exports.sendError = sendError;
function sendSuccess(res, message, data, statusCode = 200) {
    const body = {
        success: true,
        message,
        data,
    };
    return res.status(statusCode).json(body);
}
function sendError(res, message, error, statusCode = 500) {
    const body = {
        success: false,
        message,
        error,
    };
    return res.status(statusCode).json(body);
}
