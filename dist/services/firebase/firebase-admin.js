"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isFirebaseAdminConfigured = isFirebaseAdminConfigured;
exports.verifyFirebaseIdToken = verifyFirebaseIdToken;
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
const env_js_1 = require("../../config/env.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
let app;
let auth;
function isFirebaseAdminConfigured() {
    return Boolean(env_js_1.env.firebaseProjectId &&
        env_js_1.env.firebaseClientEmail &&
        env_js_1.env.firebasePrivateKey);
}
function getFirebaseApp() {
    if (!isFirebaseAdminConfigured()) {
        throw new error_middleware_js_1.AppError("Google sign-in is not configured on the server", 503, "FIREBASE_NOT_CONFIGURED");
    }
    if (app) {
        return app;
    }
    const existing = (0, app_1.getApps)()[0];
    if (existing) {
        app = existing;
        return app;
    }
    app = (0, app_1.initializeApp)({
        credential: (0, app_1.cert)({
            projectId: env_js_1.env.firebaseProjectId,
            clientEmail: env_js_1.env.firebaseClientEmail,
            privateKey: env_js_1.env.firebasePrivateKey,
        }),
    });
    return app;
}
function getFirebaseAuth() {
    if (!auth) {
        auth = (0, auth_1.getAuth)(getFirebaseApp());
    }
    return auth;
}
async function verifyFirebaseIdToken(idToken) {
    let decoded;
    try {
        decoded = await getFirebaseAuth().verifyIdToken(idToken);
    }
    catch {
        throw new error_middleware_js_1.AppError("Invalid or expired Google sign-in", 401, "INVALID_FIREBASE_TOKEN");
    }
    const email = decoded.email?.trim().toLowerCase();
    if (!email) {
        throw new error_middleware_js_1.AppError("This sign-in method must provide an email address", 400, "FIREBASE_EMAIL_REQUIRED");
    }
    const name = typeof decoded.name === "string" && decoded.name.trim()
        ? decoded.name.trim()
        : null;
    return {
        uid: decoded.uid,
        email,
        name,
        emailVerified: decoded.email_verified === true,
    };
}
