"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetTokenModel = void 0;
const mongoose_1 = require("mongoose");
const passwordResetSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    tokenHash: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
}, { timestamps: true });
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
exports.PasswordResetTokenModel = (0, mongoose_1.model)("PasswordResetToken", passwordResetSchema);
