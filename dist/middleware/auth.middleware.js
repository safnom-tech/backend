"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
const jwt_js_1 = require("../utils/jwt.js");
const env_js_1 = require("../config/env.js");
const error_middleware_js_1 = require("./error.middleware.js");
function requireAuth(req, _res, next) {
    const token = req.cookies[env_js_1.env.cookieName];
    if (!token) {
        next(new error_middleware_js_1.AppError("Authentication required", 401, "UNAUTHORIZED"));
        return;
    }
    try {
        const payload = (0, jwt_js_1.verifyAccessToken)(token);
        req.user = { id: payload.sub, email: payload.email };
        next();
    }
    catch {
        next(new error_middleware_js_1.AppError("Invalid or expired session", 401, "UNAUTHORIZED"));
    }
}
