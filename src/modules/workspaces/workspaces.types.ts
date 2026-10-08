import type { Types } from "mongoose";
import {
  normalizeBusinessProfile,
  type WorkspaceBusinessProfile,
} from "./business-profile.types.js";
import type { WorkspaceDocument } from "./workspaces.model.js";
import type { WorkspaceMemberRole } from "./workspace-member.model.js";

export type { WorkspaceBusinessProfile };

export interface PublicWorkspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  businessProfile: WorkspaceBusinessProfile;
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkspaceWithRole extends PublicWorkspace {
  role: WorkspaceMemberRole;
}

/** Future domain resources should extend this for data isolation */
export interface WorkspaceScoped {
  workspaceId: string;
}

export function toPublicWorkspace(doc: WorkspaceDocument): PublicWorkspace {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    ownerId: doc.ownerId.toString(),
    businessProfile: normalizeBusinessProfile(doc.businessProfile),
    createdAt: doc.createdAt ?? new Date(),
    updatedAt: doc.updatedAt ?? new Date(),
  };
}

export function toPublicWorkspaceFromLean(doc: {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  ownerId: Types.ObjectId;
  businessProfile?: unknown;
  createdAt?: Date;
  updatedAt?: Date;
}): PublicWorkspace {
  return {
    id: doc._id.toString(),
    name: doc.name,
    slug: doc.slug,
    ownerId: doc.ownerId.toString(),
    businessProfile: normalizeBusinessProfile(doc.businessProfile),
    createdAt: doc.createdAt ?? new Date(),
    updatedAt: doc.updatedAt ?? new Date(),
  };
}
