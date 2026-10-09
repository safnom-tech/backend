"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const env_js_1 = require("../config/env.js");
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign(payload, env_js_1.env.jwtSecret, {
        expiresIn: env_js_1.env.jwtExpiresIn,
    });
}
function verifyAccessToken(token) {
    const decoded = jsonwebtoken_1.default.verify(token, env_js_1.env.jwtSecret);
    if (typeof decoded !== "object" || decoded === null) {
        throw new Error("Invalid token payload");
    }
    const sub = "sub" in decoded ? String(decoded.sub) : "";
    const email = "email" in decoded ? String(decoded.email) : "";
    if (!sub || !email) {
        throw new Error("Invalid token payload");
    }
    return { sub, email };
}
