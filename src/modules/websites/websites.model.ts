import { Schema, model, type Document, Types } from "mongoose";

export const WEBSITE_STATUSES = ["DRAFT", "PUBLISHED", "UNPUBLISHED"] as const;
export type WebsiteStatus = (typeof WEBSITE_STATUSES)[number];

export interface WebsiteTheme {
  colors?: Record<string, string>;
  typography?: Record<string, string>;
  buttons?: Record<string, string>;
}

/** Immutable page payload stored inside publishedSnapshot at publish time. */
export interface PublishedSnapshotPage {
  slug: string;
  name: string;
  pageType: string;
  status: string;
  seo: {
    title?: string | null;
    metaDescription?: string | null;
    socialImage?: string | null;
  };
  sections: Array<{
    id: string;
    type: string;
    order: number;
    data: Record<string, unknown>;
    settings: Record<string, unknown>;
  }>;
}

export interface PublishedWebsiteSnapshot {
  version: number;
  website: {
    name: string;
    description: string | null;
    theme: WebsiteTheme;
    settings: Record<string, unknown>;
  };
  pages: PublishedSnapshotPage[];
}

export interface WebsiteDocument extends Document {
  workspaceId: Types.ObjectId;
  name: string;
  description?: string | null;
  slug: string;
  /** Customer-facing website identity (not Mongo _id). */
  publicId?: string;
  /** Placeholder subscription identity for future billing association. */
  subscriptionId?: string;
  status: WebsiteStatus;
  /** Global Safnom subdomain (e.g. business → business.safnom.in). */
  subdomain?: string | null;
  /** Platform apex domain for published URLs (e.g. safnom.in, safnom.site). */
  platformDomain?: string | null;
  publishedAt?: Date | null;
  publishedVersion: number;
  publishedSnapshot?: PublishedWebsiteSnapshot | null;
  theme: WebsiteTheme;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const websiteSchema = new Schema<WebsiteDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
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
      enum: WEBSITE_STATUSES,
      default: "DRAFT",
    },
    subdomain: { type: String, trim: true, lowercase: true },
    platformDomain: { type: String, trim: true, lowercase: true },
    publishedAt: { type: Date, default: null },
    publishedVersion: { type: Number, required: true, default: 0 },
    publishedSnapshot: { type: Schema.Types.Mixed, default: null },
    theme: {
      type: Schema.Types.Mixed,
      default: () => ({
        colors: { primary: "#3da6ad", background: "#ffffff", text: "#1a3a4a" },
        typography: { headingFont: "system-ui", bodyFont: "system-ui" },
        buttons: { style: "rounded", size: "medium" },
      }),
    },
    settings: { type: Schema.Types.Mixed, default: () => ({}) },
  },
  { timestamps: true }
);

websiteSchema.index({ workspaceId: 1, slug: 1 }, { unique: true });
websiteSchema.index({ publicId: 1 }, { unique: true, sparse: true });
websiteSchema.index({ subscriptionId: 1 }, { unique: true, sparse: true });
websiteSchema.index({ workspaceId: 1, updatedAt: -1 });
websiteSchema.index(
  { subdomain: 1 },
  {
    unique: true,
    partialFilterExpression: {
      subdomain: { $exists: true, $type: "string" },
    },
  }
);
websiteSchema.index({ status: 1, subdomain: 1 });

export const WebsiteModel = model<WebsiteDocument>("Website", websiteSchema);
