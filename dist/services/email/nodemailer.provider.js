"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodemailerEmailProvider = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const env_js_1 = require("../../config/env.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
class NodemailerEmailProvider {
    transporter;
    constructor() {
        if (!env_js_1.env.smtpHost) {
            throw new error_middleware_js_1.AppError("SMTP_HOST is required when EMAIL_PROVIDER=smtp", 500, "EMAIL_CONFIG_ERROR");
        }
        this.transporter = nodemailer_1.default.createTransport({
            host: env_js_1.env.smtpHost,
            port: env_js_1.env.smtpPort,
            secure: env_js_1.env.smtpPort === 465,
            auth: env_js_1.env.smtpUser && env_js_1.env.smtpPass
                ? { user: env_js_1.env.smtpUser, pass: env_js_1.env.smtpPass }
                : undefined,
        });
    }
    async send(input) {
        await this.transporter.sendMail({
            from: env_js_1.env.emailFrom,
            to: input.to,
            subject: input.subject,
            text: input.text,
            html: input.html,
        });
    }
}
exports.NodemailerEmailProvider = NodemailerEmailProvider;
