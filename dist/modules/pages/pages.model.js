"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PageModel = exports.PAGE_STATUSES = exports.PAGE_TYPES = void 0;
const mongoose_1 = require("mongoose");
const pages_constants_js_1 = require("./pages.constants.js");
exports.PAGE_TYPES = [
    "HOME",
    "ABOUT",
    "SERVICES",
    "CONTACT",
    "CUSTOM",
];
exports.PAGE_STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED"];
const seoSchema = new mongoose_1.Schema({
    title: { type: String, trim: true, default: null },
    metaDescription: { type: String, trim: true, default: null },
    socialImage: { type: String, trim: true, default: null },
}, { _id: false });
const sectionSchema = new mongoose_1.Schema({
    type: {
        type: String,
        required: true,
        enum: pages_constants_js_1.SECTION_TYPES,
    },
    order: { type: Number, required: true },
    data: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    settings: { type: mongoose_1.Schema.Types.Mixed, default: {} },
}, { _id: true });
const pageSchema = new mongoose_1.Schema({
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "Workspace",
        index: true,
    },
    websiteId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "Website",
        index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    pageType: {
        type: String,
        required: true,
        enum: exports.PAGE_TYPES,
        default: "CUSTOM",
    },
    status: {
        type: String,
        required: true,
        enum: exports.PAGE_STATUSES,
        default: "DRAFT",
    },
    seo: { type: seoSchema, default: () => ({}) },
    sections: { type: [sectionSchema], default: [] },
}, { timestamps: true });
pageSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
pageSchema.index({ workspaceId: 1, websiteId: 1, updatedAt: -1 });
exports.PageModel = (0, mongoose_1.model)("Page", pageSchema);
