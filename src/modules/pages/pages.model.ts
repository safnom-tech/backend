import { Schema, model, type Document, Types } from "mongoose";
import { SECTION_TYPES } from "./pages.constants.js";

export const PAGE_TYPES = [
  "HOME",
  "ABOUT",
  "SERVICES",
  "CONTACT",
  "CUSTOM",
] as const;
export type PageType = (typeof PAGE_TYPES)[number];

export const PAGE_STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED"] as const;
export type PageStatus = (typeof PAGE_STATUSES)[number];

export interface PageSectionSubdoc {
  _id: Types.ObjectId;
  type: string;
  order: number;
  data: Record<string, unknown>;
  settings: Record<string, unknown>;
}

export interface PageDocument extends Document {
  workspaceId: Types.ObjectId;
  websiteId: Types.ObjectId;
  name: string;
  slug: string;
  pageType: PageType;
  status: PageStatus;
  seo: {
    title?: string | null;
    metaDescription?: string | null;
    socialImage?: string | null;
  };
  sections: Types.DocumentArray<PageSectionSubdoc>;
  createdAt: Date;
  updatedAt: Date;
}

const seoSchema = new Schema(
  {
    title: { type: String, trim: true, default: null },
    metaDescription: { type: String, trim: true, default: null },
    socialImage: { type: String, trim: true, default: null },
  },
  { _id: false }
);

const sectionSchema = new Schema<PageSectionSubdoc>(
  {
    type: {
      type: String,
      required: true,
      enum: SECTION_TYPES,
    },
    order: { type: Number, required: true },
    data: { type: Schema.Types.Mixed, default: {} },
    settings: { type: Schema.Types.Mixed, default: {} },
  },
  { _id: true }
);

const pageSchema = new Schema<PageDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Workspace",
      index: true,
    },
    websiteId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Website",
      index: true,
    },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    pageType: {
      type: String,
      required: true,
      enum: PAGE_TYPES,
      default: "CUSTOM",
    },
    status: {
      type: String,
      required: true,
      enum: PAGE_STATUSES,
      default: "DRAFT",
    },
    seo: { type: seoSchema, default: () => ({}) },
    sections: { type: [sectionSchema], default: [] },
  },
  { timestamps: true }
);

pageSchema.index({ websiteId: 1, slug: 1 }, { unique: true });
pageSchema.index({ workspaceId: 1, websiteId: 1, updatedAt: -1 });

export const PageModel = model<PageDocument>("Page", pageSchema);
