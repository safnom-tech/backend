"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MediaModel = void 0;
const mongoose_1 = require("mongoose");
const mediaSchema = new mongoose_1.Schema({
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true,
        index: true,
    },
    filename: { type: String, required: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true },
}, { timestamps: true });
mediaSchema.index({ workspaceId: 1, createdAt: -1 });
exports.MediaModel = (0, mongoose_1.model)("Media", mediaSchema);
