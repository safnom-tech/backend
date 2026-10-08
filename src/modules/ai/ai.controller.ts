import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../middleware/error.middleware.js";
import * as fieldContentService from "./content/field-content.service.js";
import * as composedSectionService from "./composed/composed-section.service.js";
import * as aiService from "./ai.service.js";

function requireWorkspaceId(req: Request): string {
  const workspaceId = String(req.params.workspaceId ?? "");
  if (!workspaceId) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }
  return workspaceId;
}

export const aiController = {
  generateWebsite: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const result = await aiService.generateWebsiteFromAi(workspaceId, req.body);
      sendSuccess(res, "AI website generated successfully", result, 201);
    } catch (error) {
      next(error);
    }
  },

  generateFieldContent: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      requireWorkspaceId(req);
      const result = await fieldContentService.generateFieldContent(req.body);
      sendSuccess(res, "AI content generated successfully", result);
    } catch (error) {
      next(error);
    }
  },

  generateComposedSection: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const result = await composedSectionService.generateComposedSection(
        workspaceId,
        req.body
      );
      sendSuccess(res, "AI section generated successfully", result);
    } catch (error) {
      next(error);
    }
  },

  regenerateComposedSection: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const result = await composedSectionService.regenerateComposedSection(
        workspaceId,
        req.body
      );
      sendSuccess(res, "AI section regenerated successfully", result);
    } catch (error) {
      next(error);
    }
  },

  editComposedSection: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const result = await composedSectionService.editComposedSection(
        workspaceId,
        req.body
      );
      sendSuccess(res, "AI section updated successfully", result);
    } catch (error) {
      next(error);
    }
  },

  sectionAction: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const result = await aiService.runSectionAction(workspaceId, req.body);
      sendSuccess(res, "AI suggestion generated successfully", result);
    } catch (error) {
      next(error);
    }
  },
};
