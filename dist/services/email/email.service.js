"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const env_js_1 = require("../../config/env.js");
const console_provider_js_1 = require("./console.provider.js");
const nodemailer_provider_js_1 = require("./nodemailer.provider.js");
const resend_provider_js_1 = require("./resend.provider.js");
let provider = null;
function getProvider() {
    if (!provider) {
        switch (env_js_1.env.emailProvider) {
            case "smtp":
                provider = new nodemailer_provider_js_1.NodemailerEmailProvider();
                break;
            case "resend":
                provider = new resend_provider_js_1.ResendEmailProvider();
                break;
            default:
                provider = new console_provider_js_1.ConsoleEmailProvider();
        }
    }
    return provider;
}
async function sendEmail(input) {
    await getProvider().send(input);
}
