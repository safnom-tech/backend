import { Schema, model, type Document, Types } from "mongoose";

export const WORKSPACE_MEMBER_ROLES = ["OWNER", "MEMBER"] as const;
export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLES)[number];

export interface WorkspaceMemberDocument extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WorkspaceMemberRole;
}

const workspaceMemberSchema = new Schema<WorkspaceMemberDocument>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Workspace",
    },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    role: {
      type: String,
      required: true,
      enum: WORKSPACE_MEMBER_ROLES,
    },
  },
  { timestamps: true }
);

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
workspaceMemberSchema.index({ userId: 1 });

export const WorkspaceMemberModel = model<WorkspaceMemberDocument>(
  "WorkspaceMember",
  workspaceMemberSchema
);
