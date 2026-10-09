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
    publicId: { type: String, trim: true, uppercase: true },
    subscriptionId: {
        type: String,
        trim: true,
        uppercase: true,
    },
    status: {
        type: String,
        required: true,
        enum: exports.WEBSITE_STATUSES,
        default: "DRAFT",
    },
    subdomain: { type: String, trim: true, lowercase: true },
    platformDomain: { type: String, trim: true, lowercase: true },
    publishedAt: { type: Date, default: null },
    publishedVersion: { type: Number, required: true, default: 0 },
    publishedSnapshot: { type: mongoose_1.Schema.Types.Mixed, default: null },
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
websiteSchema.index({ publicId: 1 }, { unique: true, sparse: true });
websiteSchema.index({ subscriptionId: 1 }, { unique: true, sparse: true });
websiteSchema.index({ workspaceId: 1, updatedAt: -1 });
websiteSchema.index({ subdomain: 1 }, {
    unique: true,
    partialFilterExpression: {
        subdomain: { $exists: true, $type: "string" },
    },
});
websiteSchema.index({ status: 1, subdomain: 1 });
exports.WebsiteModel = (0, mongoose_1.model)("Website", websiteSchema);
