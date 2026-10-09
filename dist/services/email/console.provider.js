"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleEmailProvider = void 0;
const logger_js_1 = require("../../utils/logger.js");
class ConsoleEmailProvider {
    async send(input) {
        logger_js_1.logger.info({ to: input.to, subject: input.subject, text: input.text }, "Email (console provider)");
    }
}
exports.ConsoleEmailProvider = ConsoleEmailProvider;
