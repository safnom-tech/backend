"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceMemberModel = exports.WORKSPACE_MEMBER_ROLES = void 0;
const mongoose_1 = require("mongoose");
exports.WORKSPACE_MEMBER_ROLES = ["OWNER", "MEMBER"];
const workspaceMemberSchema = new mongoose_1.Schema({
    workspaceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true,
        ref: "Workspace",
    },
    userId: { type: mongoose_1.Schema.Types.ObjectId, required: true, ref: "User" },
    role: {
        type: String,
        required: true,
        enum: exports.WORKSPACE_MEMBER_ROLES,
    },
}, { timestamps: true });
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });
workspaceMemberSchema.index({ userId: 1 });
exports.WorkspaceMemberModel = (0, mongoose_1.model)("WorkspaceMember", workspaceMemberSchema);
