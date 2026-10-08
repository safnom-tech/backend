import { Schema, model, type Document, Types } from "mongoose";

export interface MediaDocument extends Document {
  workspaceId: Types.ObjectId;
  filename: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  createdAt: Date;
  updatedAt: Date;
}

const mediaSchema = new Schema<MediaDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: "Workspace",
      required: true,
      index: true,
    },
    filename: { type: String, required: true },
    originalFilename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    storageKey: { type: String, required: true },
  },
  { timestamps: true }
);

mediaSchema.index({ workspaceId: 1, createdAt: -1 });

export const MediaModel = model<MediaDocument>("Media", mediaSchema);
