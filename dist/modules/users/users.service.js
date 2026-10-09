"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = getUserById;
exports.updateUserProfile = updateUserProfile;
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const users_model_js_1 = require("./users.model.js");
const users_types_js_1 = require("./users.types.js");
async function getUserById(userId) {
    const user = await users_model_js_1.UserModel.findById(userId);
    if (!user) {
        throw new error_middleware_js_1.AppError("User not found", 404, "USER_NOT_FOUND");
    }
    return (0, users_types_js_1.toPublicUser)(user);
}
async function updateUserProfile(userId, input) {
    const user = await users_model_js_1.UserModel.findById(userId);
    if (!user) {
        throw new error_middleware_js_1.AppError("User not found", 404, "USER_NOT_FOUND");
    }
    if (input.name !== undefined) {
        user.name = input.name;
    }
    await user.save();
    return (0, users_types_js_1.toPublicUser)(user);
}
