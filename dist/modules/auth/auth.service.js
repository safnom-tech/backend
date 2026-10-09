"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signup = signup;
exports.login = login;
exports.forgotPassword = forgotPassword;
exports.resetPassword = resetPassword;
const env_js_1 = require("../../config/env.js");
const email_service_js_1 = require("../../services/email/email.service.js");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const jwt_js_1 = require("../../utils/jwt.js");
const password_js_1 = require("../../utils/password.js");
const reset_token_js_1 = require("../../utils/reset-token.js");
const users_model_js_1 = require("../users/users.model.js");
const users_types_js_1 = require("../users/users.types.js");
const auth_password_reset_model_js_1 = require("./auth.password-reset.model.js");
const RESET_EXPIRY_MS = 60 * 60 * 1000;
async function signup(input) {
    const existing = await users_model_js_1.UserModel.findOne({ email: input.email });
    if (existing) {
        throw new error_middleware_js_1.AppError("Email already registered", 409, "EMAIL_EXISTS");
    }
    const passwordHash = await (0, password_js_1.hashPassword)(input.password);
    const user = await users_model_js_1.UserModel.create({
        email: input.email,
        passwordHash,
        name: input.name ?? null,
    });
    const accessToken = (0, jwt_js_1.signAccessToken)({
        sub: user._id.toString(),
        email: user.email,
    });
    return { user: (0, users_types_js_1.toPublicUser)(user), accessToken };
}
async function login(input) {
    const user = await users_model_js_1.UserModel.findOne({ email: input.email }).select("+passwordHash");
    if (!user) {
        throw new error_middleware_js_1.AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    const valid = await (0, password_js_1.verifyPassword)(input.password, user.passwordHash);
    if (!valid) {
        throw new error_middleware_js_1.AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    const accessToken = (0, jwt_js_1.signAccessToken)({
        sub: user._id.toString(),
        email: user.email,
    });
    return { user: (0, users_types_js_1.toPublicUser)(user), accessToken };
}
async function forgotPassword(input) {
    const user = await users_model_js_1.UserModel.findOne({ email: input.email });
    if (!user) {
        return;
    }
    const rawToken = (0, reset_token_js_1.generateResetToken)();
    const tokenHash = (0, reset_token_js_1.hashResetToken)(rawToken);
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_MS);
    await auth_password_reset_model_js_1.PasswordResetTokenModel.deleteMany({ userId: user._id, usedAt: null });
    await auth_password_reset_model_js_1.PasswordResetTokenModel.create({
        userId: user._id,
        tokenHash,
        expiresAt,
    });
    const resetUrl = `${env_js_1.env.frontendUrl.replace(/\/$/, "")}/reset-password?token=${rawToken}`;
    await (0, email_service_js_1.sendEmail)({
        to: user.email,
        subject: "Reset your Safnom password",
        text: `Reset your password using this link (expires in 1 hour): ${resetUrl}`,
        html: `<p>Reset your password using this link (expires in 1 hour):</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
}
async function resetPassword(input) {
    const tokenHash = (0, reset_token_js_1.hashResetToken)(input.token);
    const record = await auth_password_reset_model_js_1.PasswordResetTokenModel.findOne({
        tokenHash,
        usedAt: null,
        expiresAt: { $gt: new Date() },
    });
    if (!record) {
        throw new error_middleware_js_1.AppError("Invalid or expired reset token", 400, "INVALID_RESET_TOKEN");
    }
    const user = await users_model_js_1.UserModel.findById(record.userId).select("+passwordHash");
    if (!user) {
        throw new error_middleware_js_1.AppError("User not found", 404, "USER_NOT_FOUND");
    }
    user.passwordHash = await (0, password_js_1.hashPassword)(input.newPassword);
    await user.save();
    record.usedAt = new Date();
    await record.save();
}
