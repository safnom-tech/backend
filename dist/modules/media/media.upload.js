"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadSingleImage = void 0;
exports.handleMulterError = handleMulterError;
const multer_1 = __importDefault(require("multer"));
const env_js_1 = require("../../config/env.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: { fileSize: env_js_1.env.mediaMaxFileSizeBytes },
});
exports.uploadSingleImage = upload.single("file");
function handleMulterError(err, next) {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            next(new error_middleware_js_1.AppError("File too large", 400, "FILE_TOO_LARGE"));
            return;
        }
        next(new error_middleware_js_1.AppError("Invalid upload", 400, "INVALID_FILE"));
        return;
    }
    next(err);
}
