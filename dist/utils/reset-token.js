"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateResetToken = generateResetToken;
exports.hashResetToken = hashResetToken;
const node_crypto_1 = require("node:crypto");
function generateResetToken() {
    return (0, node_crypto_1.randomBytes)(32).toString("hex");
}
function hashResetToken(token) {
    return (0, node_crypto_1.createHash)("sha256").update(token).digest("hex");
}
