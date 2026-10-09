"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResendEmailProvider = void 0;
const resend_1 = require("resend");
const env_js_1 = require("../../config/env.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const email_from_util_js_1 = require("./email-from.util.js");
class ResendEmailProvider {
    client;
    constructor() {
        if (!env_js_1.env.resendApiKey) {
            throw new error_middleware_js_1.AppError("RESEND_API_KEY is required when EMAIL_PROVIDER=resend", 500, "EMAIL_CONFIG_ERROR");
        }
        this.client = new resend_1.Resend(env_js_1.env.resendApiKey);
    }
    async send(input) {
        const replyTo = (0, email_from_util_js_1.normalizeReplyTo)(input.replyTo);
        const { error } = await this.client.emails.send({
            from: env_js_1.env.emailFrom,
            to: [input.to],
            subject: input.subject,
            text: input.text,
            html: input.html,
            ...(replyTo ? { replyTo } : {}),
        });
        if (error) {
            throw new error_middleware_js_1.AppError(error.message ?? "Failed to send email via Resend", 502, "EMAIL_SEND_FAILED");
        }
    }
}
exports.ResendEmailProvider = ResendEmailProvider;
