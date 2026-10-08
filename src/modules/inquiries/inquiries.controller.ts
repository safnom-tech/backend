import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/apiResponse.js";
import * as inquiriesService from "./inquiries.service.js";

export const inquiriesController = {
  publicWebsite: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      await inquiriesService.submitInquiryForPublicWebsite(
        String(req.params.publicId),
        req.body
      );
      sendSuccess(res, "Inquiry sent successfully", { sent: true });
    } catch (error) {
      next(error);
    }
  },

  workspace: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const body = req.body as {
        name: string;
        email: string;
        message: string;
        websiteId?: string;
      };
      await inquiriesService.submitInquiryForWorkspace(
        String(req.params.workspaceId),
        {
          name: body.name,
          email: body.email,
          message: body.message,
        },
        { websiteId: body.websiteId }
      );
      sendSuccess(res, "Inquiry sent successfully", { sent: true });
    } catch (error) {
      next(error);
    }
  },
};
