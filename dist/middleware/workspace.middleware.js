"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireWorkspaceParamAccess = requireWorkspaceParamAccess;
const error_middleware_js_1 = require("./error.middleware.js");
const workspaces_service_js_1 = require("../modules/workspaces/workspaces.service.js");
const workspaces_validators_js_1 = require("../modules/workspaces/workspaces.validators.js");
/**
 * Validates :workspaceId route param and attaches workspace + role to the request.
 * Use after requireAuth on workspace-scoped routes in future modules.
 */
async function requireWorkspaceParamAccess(req, _res, next) {
    try {
        if (!req.user?.id) {
            next(new error_middleware_js_1.AppError("Authentication required", 401, "UNAUTHORIZED"));
            return;
        }
        const parsed = workspaces_validators_js_1.workspaceIdParamSchema.safeParse(req.params);
        if (!parsed.success) {
            next(new error_middleware_js_1.AppError(parsed.error.issues.map((e) => e.message).join("; ") ||
                "Invalid workspace ID", 400, "VALIDATION_ERROR"));
            return;
        }
        const { workspaceId } = parsed.data;
        const ctx = await (0, workspaces_service_js_1.assertWorkspaceMember)(req.user.id, workspaceId);
        req.workspace = ctx.workspace;
        req.workspaceRole = ctx.role;
        next();
    }
    catch (error) {
        next(error);
    }
}
