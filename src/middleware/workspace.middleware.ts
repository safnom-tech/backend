import type { NextFunction, Request, Response } from "express";
import { AppError } from "./error.middleware.js";
import { assertWorkspaceMember } from "../modules/workspaces/workspaces.service.js";
import { workspaceIdParamSchema } from "../modules/workspaces/workspaces.validators.js";

/**
 * Validates :workspaceId route param and attaches workspace + role to the request.
 * Use after requireAuth on workspace-scoped routes in future modules.
 */
export async function requireWorkspaceParamAccess(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user?.id) {
      next(new AppError("Authentication required", 401, "UNAUTHORIZED"));
      return;
    }

    const parsed = workspaceIdParamSchema.safeParse(req.params);
    if (!parsed.success) {
      next(
        new AppError(
          parsed.error.issues.map((e) => e.message).join("; ") ||
            "Invalid workspace ID",
          400,
          "VALIDATION_ERROR"
        )
      );
      return;
    }

    const { workspaceId } = parsed.data;
    const ctx = await assertWorkspaceMember(req.user.id, workspaceId);
    req.workspace = ctx.workspace;
    req.workspaceRole = ctx.role;
    next();
  } catch (error) {
    next(error);
  }
}
