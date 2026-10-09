"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateModel = void 0;
const mongoose_1 = require("mongoose");
const templateSchema = new mongoose_1.Schema({
    templateId: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    previewThumbnailUrl: { type: String, trim: true, default: null },
    theme: { type: mongoose_1.Schema.Types.Mixed, required: true },
    pages: { type: mongoose_1.Schema.Types.Mixed, required: true },
    version: { type: Number, required: true, default: 1 },
    published: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0 },
}, { timestamps: true });
templateSchema.index({ templateId: 1 }, { unique: true });
templateSchema.index({ published: 1, sortOrder: 1, templateId: 1 });
exports.TemplateModel = (0, mongoose_1.model)("Template", templateSchema);
