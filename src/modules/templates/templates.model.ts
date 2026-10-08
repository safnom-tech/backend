import { Schema, model, type Document } from "mongoose";
import type { TemplateCategory } from "./templates.types.js";
import type { WebsiteTheme } from "../websites/websites.model.js";
import type { TemplatePageDefinition } from "./templates.types.js";

export interface TemplateDocument extends Document {
  templateId: string;
  name: string;
  category: TemplateCategory;
  description: string;
  previewThumbnailUrl?: string | null;
  theme: WebsiteTheme;
  pages: TemplatePageDefinition[];
  version: number;
  published: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const templateSchema = new Schema<TemplateDocument>(
  {
    templateId: { type: String, required: true, trim: true, lowercase: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    previewThumbnailUrl: { type: String, trim: true, default: null },
    theme: { type: Schema.Types.Mixed, required: true },
    pages: { type: Schema.Types.Mixed, required: true },
    version: { type: Number, required: true, default: 1 },
    published: { type: Boolean, required: true, default: true },
    sortOrder: { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

templateSchema.index({ templateId: 1 }, { unique: true });
templateSchema.index({ published: 1, sortOrder: 1, templateId: 1 });

export const TemplateModel = model<TemplateDocument>("Template", templateSchema);
