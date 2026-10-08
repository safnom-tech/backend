import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../middleware/error.middleware.js";
import { businessProfileHasName } from "../workspaces/business-profile.types.js";
import { getWorkspaceBusinessProfile } from "../workspaces/workspaces.service.js";
import { createPage } from "../pages/pages.service.js";
import { applyTemplateToWebsite } from "../templates/templates.service.js";
import * as websitesService from "./websites.service.js";

function requireWorkspaceId(req: Request): string {
  const workspaceId = String(req.params.workspaceId ?? "");
  if (!workspaceId) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }
  return workspaceId;
}

export const websitesController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const { templateId, ...createInput } = req.body as {
        templateId?: string;
        name?: string;
        description?: string;
      };
      let resolvedName = createInput.name?.trim();
      if (!resolvedName) {
        const profile = await getWorkspaceBusinessProfile(workspaceId);
        if (businessProfileHasName(profile)) {
          resolvedName = profile.businessName!.trim();
        }
      }
      if (!resolvedName) {
        throw new AppError(
          "Add your business name in Business profile before creating a website",
          400,
          "BUSINESS_PROFILE_REQUIRED"
        );
      }
      let website = await websitesService.createWebsite(workspaceId, {
        ...createInput,
        name: resolvedName,
      });
      if (templateId) {
        website = await applyTemplateToWebsite(
          workspaceId,
          website.id,
          templateId
        );
      } else {
        // Blank sites need a Home page so preview/editor work immediately.
        await createPage(workspaceId, website.id, {
          name: "Home",
          slug: "home",
          pageType: "HOME",
        });
      }
      sendSuccess(res, "Website created successfully", website, 201);
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
      const workspaceId = requireWorkspaceId(req);
      const websites = await websitesService.listWebsitesForWorkspace(
        workspaceId
      );
      sendSuccess(res, "Websites retrieved successfully", { websites });
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
      const workspaceId = requireWorkspaceId(req);
      const website = await websitesService.getWebsite(
        workspaceId,
        String(req.params.websiteId)
      );
      sendSuccess(res, "Website retrieved successfully", website);
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
      const workspaceId = requireWorkspaceId(req);
      const website = await websitesService.updateWebsite(
        workspaceId,
        String(req.params.websiteId),
        req.body
      );
      sendSuccess(res, "Website updated successfully", website);
    } catch (error) {
      next(error);
    }
  },

  delete: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      await websitesService.deleteWebsite(
        workspaceId,
        String(req.params.websiteId)
      );
      sendSuccess(res, "Website deleted successfully", null);
    } catch (error) {
      next(error);
    }
  },

  preview: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const slug =
        typeof req.query.slug === "string" ? req.query.slug : undefined;
      const payload = await websitesService.getWebsitePreview(
        workspaceId,
        String(req.params.websiteId),
        slug
      );
      sendSuccess(res, "Website preview retrieved successfully", payload);
    } catch (error) {
      next(error);
    }
  },
};
