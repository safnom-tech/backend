import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../middleware/error.middleware.js";
import * as workspacesService from "./workspaces.service.js";

function requireUserId(req: Request): string {
  if (!req.user?.id) {
    throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  }
  return req.user.id;
}

export const workspacesController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const workspace = await workspacesService.createWorkspace(
        userId,
        req.body
      );
      sendSuccess(res, "Workspace created successfully", workspace, 201);
    } catch (error) {
      next(error);
    }
  },

  list: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const workspaces = await workspacesService.listWorkspacesForUser(userId);
      sendSuccess(res, "Workspaces retrieved successfully", { workspaces });
    } catch (error) {
      next(error);
    }
  },

  getCurrent: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const workspace = await workspacesService.getCurrentWorkspace(userId);
      if (!workspace) {
        sendSuccess(res, "No workspace selected", { workspace: null });
        return;
      }
      sendSuccess(res, "Current workspace retrieved successfully", {
        workspace,
      });
    } catch (error) {
      next(error);
    }
  },

  getOne: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const workspace = await workspacesService.getWorkspaceForMember(
        userId,
        String(req.params.workspaceId)
      );
      sendSuccess(res, "Workspace retrieved successfully", workspace);
    } catch (error) {
      next(error);
    }
  },

  update: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const workspace = await workspacesService.updateWorkspaceForMember(
        userId,
        String(req.params.workspaceId),
        req.body
      );
      sendSuccess(res, "Workspace updated successfully", workspace);
    } catch (error) {
      next(error);
    }
  },

  select: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = requireUserId(req);
      const workspace = await workspacesService.selectWorkspace(
        userId,
        String(req.params.workspaceId)
      );
      sendSuccess(res, "Workspace selected successfully", workspace);
    } catch (error) {
      next(error);
    }
  },
};
