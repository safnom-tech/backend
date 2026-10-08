import { Schema, model, type Document, Types } from "mongoose";
import type { WorkspaceBusinessProfile } from "./business-profile.types.js";

export interface WorkspaceDocument extends Document {
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  businessProfile: WorkspaceBusinessProfile;
  createdAt: Date;
  updatedAt: Date;
}

const workspaceSchema = new Schema<WorkspaceDocument>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, lowercase: true },
    ownerId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    businessProfile: {
      type: Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { timestamps: true }
);

workspaceSchema.index({ slug: 1 }, { unique: true });

/** Registered when workspace features are implemented; exported for module structure */
export const WorkspaceModel = model<WorkspaceDocument>(
  "Workspace",
  workspaceSchema
);
