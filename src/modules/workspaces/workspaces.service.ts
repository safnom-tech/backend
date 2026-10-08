import { Types } from "mongoose";
import { AppError } from "../../middleware/error.middleware.js";
import { isValidSlug, slugifyName } from "../../utils/slugify.js";
import { UserModel } from "../users/users.model.js";
import {
  WorkspaceMemberModel,
  type WorkspaceMemberRole,
} from "./workspace-member.model.js";
import { WorkspaceModel } from "./workspaces.model.js";
import {
  normalizeBusinessProfile,
  type WorkspaceBusinessProfile,
} from "./business-profile.types.js";
import {
  toPublicWorkspace,
  toPublicWorkspaceFromLean,
  type PublicWorkspace,
  type WorkspaceWithRole,
} from "./workspaces.types.js";
import type {
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "./workspaces.validators.js";

export interface WorkspaceContext {
  workspace: PublicWorkspace;
  role: WorkspaceMemberRole;
}

export async function assertWorkspaceMember(
  userId: string,
  workspaceId: string
): Promise<WorkspaceContext> {
  if (!Types.ObjectId.isValid(workspaceId)) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }

  const member = await WorkspaceMemberModel.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
    userId: new Types.ObjectId(userId),
  });

  if (!member) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }

  const workspace = await WorkspaceModel.findById(workspaceId);
  if (!workspace) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }

  return {
    workspace: toPublicWorkspace(workspace),
    role: member.role,
  };
}

export async function resolveWorkspaceContext(
  userId: string,
  workspaceId: string
): Promise<WorkspaceContext> {
  return assertWorkspaceMember(userId, workspaceId);
}

async function generateUniqueSlug(baseName: string, preferred?: string): Promise<string> {
  let base = preferred?.trim().toLowerCase() ?? slugifyName(baseName);
  if (!base || !isValidSlug(base)) {
    base = slugifyName(baseName) || "workspace";
  }
  if (!isValidSlug(base)) {
    throw new AppError("Could not generate a valid slug", 400, "VALIDATION_ERROR");
  }

  let candidate = base;
  let suffix = 2;
  while (await WorkspaceModel.exists({ slug: candidate })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
    if (suffix > 100) {
      throw new AppError("Slug already taken", 409, "WORKSPACE_SLUG_TAKEN");
    }
  }
  return candidate;
}

export async function createWorkspace(
  userId: string,
  input: CreateWorkspaceInput
): Promise<PublicWorkspace> {
  let slug: string;
  if (input.slug) {
    if (!isValidSlug(input.slug)) {
      throw new AppError("Invalid slug format", 400, "VALIDATION_ERROR");
    }
    if (await WorkspaceModel.exists({ slug: input.slug })) {
      throw new AppError("Slug already taken", 409, "WORKSPACE_SLUG_TAKEN");
    }
    slug = input.slug;
  } else {
    slug = await generateUniqueSlug(input.name);
  }

  let workspace;
  try {
    workspace = await WorkspaceModel.create({
      name: input.name.trim(),
      slug,
      ownerId: new Types.ObjectId(userId),
    });
  } catch (err: unknown) {
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      throw new AppError("Slug already taken", 409, "WORKSPACE_SLUG_TAKEN");
    }
    throw err;
  }

  await WorkspaceMemberModel.create({
    workspaceId: workspace._id,
    userId: new Types.ObjectId(userId),
    role: "OWNER",
  });

  await UserModel.findByIdAndUpdate(userId, {
    currentWorkspaceId: workspace._id,
  });

  return toPublicWorkspace(workspace);
}

export async function listWorkspacesForUser(
  userId: string
): Promise<WorkspaceWithRole[]> {
  const memberships = await WorkspaceMemberModel.find({
    userId: new Types.ObjectId(userId),
  }).lean();

  if (memberships.length === 0) {
    return [];
  }

  const workspaceIds = memberships.map((m) => m.workspaceId);
  const workspaces = await WorkspaceModel.find({
    _id: { $in: workspaceIds },
  }).lean();

  const roleByWorkspaceId = new Map(
    memberships.map((m) => [m.workspaceId.toString(), m.role])
  );

  return workspaces.map((w) => ({
    ...toPublicWorkspaceFromLean(w),
    role: roleByWorkspaceId.get(w._id.toString()) ?? "MEMBER",
  }));
}

export async function getWorkspaceForMember(
  userId: string,
  workspaceId: string
): Promise<WorkspaceWithRole> {
  const ctx = await assertWorkspaceMember(userId, workspaceId);
  return { ...ctx.workspace, role: ctx.role };
}

export async function updateWorkspaceForMember(
  userId: string,
  workspaceId: string,
  input: UpdateWorkspaceInput
): Promise<PublicWorkspace> {
  await assertWorkspaceMember(userId, workspaceId);

  const update: Record<string, unknown> = {};
  if (input.name !== undefined) {
    update.name = input.name.trim();
  }
  if (input.businessProfile !== undefined) {
    const existing = await WorkspaceModel.findById(workspaceId).select(
      "businessProfile"
    );
    const merged: WorkspaceBusinessProfile = {
      ...normalizeBusinessProfile(existing?.businessProfile),
      ...input.businessProfile,
    };
    update.businessProfile = merged;
  }

  const workspace = await WorkspaceModel.findByIdAndUpdate(
    workspaceId,
    { $set: update },
    { new: true }
  );

  if (!workspace) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }

  return toPublicWorkspace(workspace);
}

export async function getWorkspaceBusinessProfile(
  workspaceId: string
): Promise<WorkspaceBusinessProfile> {
  const workspace = await WorkspaceModel.findById(workspaceId).select(
    "businessProfile"
  );
  if (!workspace) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }
  return normalizeBusinessProfile(workspace.businessProfile);
}

export async function selectWorkspace(
  userId: string,
  workspaceId: string
): Promise<PublicWorkspace> {
  const ctx = await assertWorkspaceMember(userId, workspaceId);
  await UserModel.findByIdAndUpdate(userId, {
    currentWorkspaceId: new Types.ObjectId(workspaceId),
  });
  return ctx.workspace;
}

export async function getCurrentWorkspace(
  userId: string
): Promise<PublicWorkspace | null> {
  const user = await UserModel.findById(userId).select("currentWorkspaceId");
  if (!user?.currentWorkspaceId) {
    return null;
  }

  const workspaceId = user.currentWorkspaceId.toString();

  try {
    const ctx = await assertWorkspaceMember(userId, workspaceId);
    return ctx.workspace;
  } catch (error) {
    if (
      error instanceof AppError &&
      error.code === "WORKSPACE_NOT_FOUND"
    ) {
      await UserModel.findByIdAndUpdate(userId, { currentWorkspaceId: null });
      return null;
    }
    throw error;
  }
}
