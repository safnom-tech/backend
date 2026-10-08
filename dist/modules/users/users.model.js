"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserModel = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, trim: true, default: null },
    emailVerified: { type: Boolean, default: false },
    currentWorkspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Workspace",
        default: null,
    },
}, { timestamps: true });
exports.UserModel = (0, mongoose_1.model)("User", userSchema);
