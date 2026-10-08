"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAuthCookie = setAuthCookie;
exports.clearAuthCookie = clearAuthCookie;
const env_js_1 = require("../config/env.js");
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
function setAuthCookie(res, token) {
    res.cookie(env_js_1.env.cookieName, token, {
        httpOnly: true,
        secure: env_js_1.env.isProduction,
        sameSite: "lax",
        maxAge: MAX_AGE_MS,
        path: "/",
    });
}
function clearAuthCookie(res) {
    res.clearCookie(env_js_1.env.cookieName, {
        httpOnly: true,
        secure: env_js_1.env.isProduction,
        sameSite: "lax",
        path: "/",
    });
}
