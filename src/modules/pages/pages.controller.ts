import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../middleware/error.middleware.js";
import * as pagesService from "./pages.service.js";

function requireWorkspaceId(req: Request): string {
  const workspaceId = String(req.params.workspaceId ?? "");
  if (!workspaceId) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }
  return workspaceId;
}

function requireWebsiteId(req: Request): string {
  return String(req.params.websiteId);
}

export const pagesController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const page = await pagesService.createPage(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        req.body
      );
      sendSuccess(res, "Page created successfully", page, 201);
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
      const pages = await pagesService.listPagesForWebsite(
        requireWorkspaceId(req),
        requireWebsiteId(req)
      );
      sendSuccess(res, "Pages retrieved successfully", { pages });
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
      const page = await pagesService.getPage(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        String(req.params.pageId)
      );
      sendSuccess(res, "Page retrieved successfully", page);
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
      const page = await pagesService.updatePage(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        String(req.params.pageId),
        req.body
      );
      sendSuccess(res, "Page updated successfully", page);
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
      await pagesService.deletePage(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        String(req.params.pageId)
      );
      sendSuccess(res, "Page deleted successfully", null);
    } catch (error) {
      next(error);
    }
  },

  addSection: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const section = await pagesService.addSection(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        String(req.params.pageId),
        req.body
      );
      sendSuccess(res, "Section added successfully", section, 201);
    } catch (error) {
      next(error);
    }
  },

  updateSection: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const section = await pagesService.updateSection(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        String(req.params.pageId),
        String(req.params.sectionId),
        req.body
      );
      sendSuccess(res, "Section updated successfully", section);
    } catch (error) {
      next(error);
    }
  },

  deleteSection: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await pagesService.deleteSection(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        String(req.params.pageId),
        String(req.params.sectionId)
      );
      sendSuccess(res, "Section deleted successfully", null);
    } catch (error) {
      next(error);
    }
  },

  duplicateSection: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const section = await pagesService.duplicateSection(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        String(req.params.pageId),
        String(req.params.sectionId)
      );
      sendSuccess(res, "Section duplicated successfully", section, 201);
    } catch (error) {
      next(error);
    }
  },

  reorderSections: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const sections = await pagesService.reorderSections(
        requireWorkspaceId(req),
        requireWebsiteId(req),
        String(req.params.pageId),
        req.body.sectionIds
      );
      sendSuccess(res, "Sections reordered successfully", { sections });
    } catch (error) {
      next(error);
    }
  },
};
