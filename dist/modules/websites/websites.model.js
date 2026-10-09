"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebsiteModel = exports.WEBSITE_STATUSES = void 0;
const mongoose_1 = require("mongoose");
exports.WEBSITE_STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED"];
const websiteSchema = new mongoose_1.Schema({
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "Workspace",
        index: true,
    },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: null },
    slug: { type: String, required: true, trim: true, lowercase: true },
    status: {
        type: String,
        required: true,
        enum: exports.WEBSITE_STATUSES,
        default: "DRAFT",
    },
    theme: {
        type: mongoose_1.Schema.Types.Mixed,
        default: () => ({
            colors: { primary: "#3da6ad", background: "#ffffff", text: "#1a3a4a" },
            typography: { headingFont: "system-ui", bodyFont: "system-ui" },
            buttons: { style: "rounded", size: "medium" },
        }),
    },
    settings: { type: mongoose_1.Schema.Types.Mixed, default: () => ({}) },
}, { timestamps: true });
websiteSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });
websiteSchema.index({ workspaceId: 1, updatedAt: -1 });
exports.WebsiteModel = (0, mongoose_1.model)("Website", websiteSchema);
