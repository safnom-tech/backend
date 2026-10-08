import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse.js";
import { setPrivateHttpCache } from "../../utils/httpCache.js";
import * as templatesService from "./templates.service.js";

export const templatesController = {
  list: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const query = req.query as { limit?: number; offset?: number };
      const result = await templatesService.listTemplates(query);
      setPrivateHttpCache(res, 120);
      sendSuccess(res, "Templates retrieved successfully", result);
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
      const template = await templatesService.getTemplateById(
        String(req.params.templateId)
      );
      setPrivateHttpCache(res, 300);
      sendSuccess(res, "Template retrieved successfully", template);
    } catch (error) {
      next(error);
    }
  },

  previewForWorkspace: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const payload = await templatesService.getTemplatePreviewForWorkspace(
        String(req.params.workspaceId),
        String(req.params.templateId)
      );
      setPrivateHttpCache(res, 60);
      sendSuccess(res, "Template preview retrieved successfully", payload);
    } catch (error) {
      next(error);
    }
  },
};
