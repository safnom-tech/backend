"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.signupSchema = void 0;
const zod_1 = require("zod");
const emailSchema = zod_1.z.string().email("Invalid email address").trim().toLowerCase();
const passwordSchema = zod_1.z
    .string()
    .min(8, "Password must be at least 8 characters");
exports.signupSchema = zod_1.z.object({
    email: emailSchema,
    password: passwordSchema,
    name: zod_1.z.string().trim().min(1).max(120).optional(),
});
exports.loginSchema = zod_1.z.object({
    email: emailSchema,
    password: zod_1.z.string().min(1, "Password is required"),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: emailSchema,
});
exports.resetPasswordSchema = zod_1.z.object({
    token: zod_1.z.string().min(1, "Reset token is required"),
    newPassword: passwordSchema,
});
