"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertWorkspaceMember = assertWorkspaceMember;
exports.resolveWorkspaceContext = resolveWorkspaceContext;
exports.createWorkspace = createWorkspace;
exports.listWorkspacesForUser = listWorkspacesForUser;
exports.getWorkspaceForMember = getWorkspaceForMember;
exports.updateWorkspaceForMember = updateWorkspaceForMember;
exports.selectWorkspace = selectWorkspace;
exports.getCurrentWorkspace = getCurrentWorkspace;
const mongoose_1 = require("mongoose");
const error_middleware_js_1 = require("../../middleware/error.middleware.js");
const slugify_js_1 = require("../../utils/slugify.js");
const users_model_js_1 = require("../users/users.model.js");
const workspace_member_model_js_1 = require("./workspace-member.model.js");
const workspaces_model_js_1 = require("./workspaces.model.js");
const workspaces_types_js_1 = require("./workspaces.types.js");
async function assertWorkspaceMember(userId, workspaceId) {
    if (!mongoose_1.Types.ObjectId.isValid(workspaceId)) {
        throw new error_middleware_js_1.AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }
    const member = await workspace_member_model_js_1.WorkspaceMemberModel.findOne({
        workspaceId: new mongoose_1.Types.ObjectId(workspaceId),
        userId: new mongoose_1.Types.ObjectId(userId),
    });
    if (!member) {
        throw new error_middleware_js_1.AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }
    const workspace = await workspaces_model_js_1.WorkspaceModel.findById(workspaceId);
    if (!workspace) {
        throw new error_middleware_js_1.AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }
    return {
        workspace: (0, workspaces_types_js_1.toPublicWorkspace)(workspace),
        role: member.role,
    };
}
async function resolveWorkspaceContext(userId, workspaceId) {
    return assertWorkspaceMember(userId, workspaceId);
}
async function generateUniqueSlug(baseName, preferred) {
    let base = preferred?.trim().toLowerCase() ?? (0, slugify_js_1.slugifyName)(baseName);
    if (!base || !(0, slugify_js_1.isValidSlug)(base)) {
        base = (0, slugify_js_1.slugifyName)(baseName) || "workspace";
    }
    if (!(0, slugify_js_1.isValidSlug)(base)) {
        throw new error_middleware_js_1.AppError("Could not generate a valid slug", 400, "VALIDATION_ERROR");
    }
    let candidate = base;
    let suffix = 2;
    while (await workspaces_model_js_1.WorkspaceModel.exists({ slug: candidate })) {
        candidate = `${base}-${suffix}`;
        suffix += 1;
        if (suffix > 100) {
            throw new error_middleware_js_1.AppError("Slug already taken", 409, "WORKSPACE_SLUG_TAKEN");
        }
    }
    return candidate;
}
async function createWorkspace(userId, input) {
    let slug;
    if (input.slug) {
        if (!(0, slugify_js_1.isValidSlug)(input.slug)) {
            throw new error_middleware_js_1.AppError("Invalid slug format", 400, "VALIDATION_ERROR");
        }
        if (await workspaces_model_js_1.WorkspaceModel.exists({ slug: input.slug })) {
            throw new error_middleware_js_1.AppError("Slug already taken", 409, "WORKSPACE_SLUG_TAKEN");
        }
        slug = input.slug;
    }
    else {
        slug = await generateUniqueSlug(input.name);
    }
    let workspace;
    try {
        workspace = await workspaces_model_js_1.WorkspaceModel.create({
            name: input.name.trim(),
            slug,
            ownerId: new mongoose_1.Types.ObjectId(userId),
        });
    }
    catch (err) {
        if (err &&
            typeof err === "object" &&
            "code" in err &&
            err.code === 11000) {
            throw new error_middleware_js_1.AppError("Slug already taken", 409, "WORKSPACE_SLUG_TAKEN");
        }
        throw err;
    }
    await workspace_member_model_js_1.WorkspaceMemberModel.create({
        workspaceId: workspace._id,
        userId: new mongoose_1.Types.ObjectId(userId),
        role: "OWNER",
    });
    await users_model_js_1.UserModel.findByIdAndUpdate(userId, {
        currentWorkspaceId: workspace._id,
    });
    return (0, workspaces_types_js_1.toPublicWorkspace)(workspace);
}
async function listWorkspacesForUser(userId) {
    const memberships = await workspace_member_model_js_1.WorkspaceMemberModel.find({
        userId: new mongoose_1.Types.ObjectId(userId),
    }).lean();
    if (memberships.length === 0) {
        return [];
    }
    const workspaceIds = memberships.map((m) => m.workspaceId);
    const workspaces = await workspaces_model_js_1.WorkspaceModel.find({
        _id: { $in: workspaceIds },
    }).lean();
    const roleByWorkspaceId = new Map(memberships.map((m) => [m.workspaceId.toString(), m.role]));
    return workspaces.map((w) => ({
        id: w._id.toString(),
        name: w.name,
        slug: w.slug,
        ownerId: w.ownerId.toString(),
        createdAt: w.createdAt ?? new Date(),
        updatedAt: w.updatedAt ?? new Date(),
        role: roleByWorkspaceId.get(w._id.toString()) ?? "MEMBER",
    }));
}
async function getWorkspaceForMember(userId, workspaceId) {
    const ctx = await assertWorkspaceMember(userId, workspaceId);
    return { ...ctx.workspace, role: ctx.role };
}
async function updateWorkspaceForMember(userId, workspaceId, input) {
    await assertWorkspaceMember(userId, workspaceId);
    const workspace = await workspaces_model_js_1.WorkspaceModel.findByIdAndUpdate(workspaceId, { name: input.name.trim() }, { new: true });
    if (!workspace) {
        throw new error_middleware_js_1.AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
    }
    return (0, workspaces_types_js_1.toPublicWorkspace)(workspace);
}
async function selectWorkspace(userId, workspaceId) {
    const ctx = await assertWorkspaceMember(userId, workspaceId);
    await users_model_js_1.UserModel.findByIdAndUpdate(userId, {
        currentWorkspaceId: new mongoose_1.Types.ObjectId(workspaceId),
    });
    return ctx.workspace;
}
async function getCurrentWorkspace(userId) {
    const user = await users_model_js_1.UserModel.findById(userId).select("currentWorkspaceId");
    if (!user?.currentWorkspaceId) {
        return null;
    }
    const workspaceId = user.currentWorkspaceId.toString();
    try {
        const ctx = await assertWorkspaceMember(userId, workspaceId);
        return ctx.workspace;
    }
    catch (error) {
        if (error instanceof error_middleware_js_1.AppError &&
            error.code === "WORKSPACE_NOT_FOUND") {
            await users_model_js_1.UserModel.findByIdAndUpdate(userId, { currentWorkspaceId: null });
            return null;
        }
        throw error;
    }
}
