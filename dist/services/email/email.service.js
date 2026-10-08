"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = sendEmail;
const env_js_1 = require("../../config/env.js");
const console_provider_js_1 = require("./console.provider.js");
const nodemailer_provider_js_1 = require("./nodemailer.provider.js");
let provider = null;
function getProvider() {
    if (!provider) {
        provider =
            env_js_1.env.emailProvider === "smtp"
                ? new nodemailer_provider_js_1.NodemailerEmailProvider()
                : new console_provider_js_1.ConsoleEmailProvider();
    }
    return provider;
}
async function sendEmail(input) {
    await getProvider().send(input);
}
