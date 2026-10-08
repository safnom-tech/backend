"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function parsePort(value, fallback) {
    const parsed = Number(value);
    if (!value || Number.isNaN(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}
function parseNodeEnv(value) {
    if (value === "production" || value === "test") {
        return value;
    }
    return "development";
}
function parseEmailProvider(value) {
    if (value === "smtp") {
        return "smtp";
    }
    return "console";
}
const nodeEnv = parseNodeEnv(process.env.NODE_ENV);
const isProduction = nodeEnv === "production";
const jwtSecret = process.env.JWT_SECRET ??
    (isProduction ? "" : "dev-jwt-secret-change-in-production");
if (isProduction && !jwtSecret) {
    throw new Error("JWT_SECRET is required in production");
}
exports.env = {
    nodeEnv,
    port: parsePort(process.env.PORT, 8080),
    mongodbUri: process.env.MONGODB_URI ?? "mongodb://localhost:27017/safnom",
    frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:3000",
    apiPrefix: process.env.API_PREFIX ?? "/api/v1",
    isProduction,
    jwtSecret,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
    cookieName: process.env.COOKIE_NAME ?? "safnom_token",
    emailProvider: parseEmailProvider(process.env.EMAIL_PROVIDER),
    emailFrom: process.env.EMAIL_FROM ?? "noreply@safnom.local",
    smtpHost: process.env.SMTP_HOST ?? "",
    smtpPort: parsePort(process.env.SMTP_PORT, 587),
    smtpUser: process.env.SMTP_USER ?? "",
    smtpPass: process.env.SMTP_PASS ?? "",
    mediaMaxFileSizeBytes: parsePort(process.env.MEDIA_MAX_FILE_SIZE_BYTES, 5_242_880),
    mediaStorageDriver: "local",
    mediaLocalRoot: process.env.MEDIA_LOCAL_ROOT ?? "./data/media",
};
