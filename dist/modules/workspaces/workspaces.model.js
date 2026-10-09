"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceModel = void 0;
const mongoose_1 = require("mongoose");
const workspaceSchema = new mongoose_1.Schema({
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    ownerId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
    businessProfile: {
        type: mongoose_1.Schema.Types.Mixed,
        default: () => ({}),
    },
}, { timestamps: true });
workspaceSchema.index({ slug: 1 }, { unique: true });
/** Registered when workspace features are implemented; exported for module structure */
exports.WorkspaceModel = (0, mongoose_1.model)("Workspace", workspaceSchema);
