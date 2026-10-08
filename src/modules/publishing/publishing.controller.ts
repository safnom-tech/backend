import type { Request, Response, NextFunction } from "express";
import { sendSuccess } from "../../utils/apiResponse.js";
import {
  getPublicSiteBySubdomain,
  getPublishingState,
  publishWebsite,
  resolveRequestHostFromHeaders,
  unpublishWebsite,
  updateSubdomain,
} from "./publishing.service.js";

function paramString(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function requestHost(req: Request): string | undefined {
  return resolveRequestHostFromHeaders({
    origin: req.headers.origin,
    referer: req.headers.referer,
    "x-forwarded-host": req.headers["x-forwarded-host"],
    host: req.headers.host,
  });
}

export const publishingController = {
  getState: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = paramString(req.params.workspaceId);
      const websiteId = paramString(req.params.websiteId);
      const data = await getPublishingState(
        workspaceId,
        websiteId,
        requestHost(req)
      );
      sendSuccess(res, "Publishing state", data);
    } catch (err) {
      next(err);
    }
  },

  publish: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = paramString(req.params.workspaceId);
      const websiteId = paramString(req.params.websiteId);
      const subdomain =
        typeof req.body?.subdomain === "string" ? req.body.subdomain : undefined;
      const data = await publishWebsite(workspaceId, websiteId, {
        subdomain,
        requestHost: requestHost(req),
      });
      sendSuccess(res, "Website published", data);
    } catch (err) {
      next(err);
    }
  },

  unpublish: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = paramString(req.params.workspaceId);
      const websiteId = paramString(req.params.websiteId);
      const data = await unpublishWebsite(
        workspaceId,
        websiteId,
        requestHost(req)
      );
      sendSuccess(res, "Website unpublished", data);
    } catch (err) {
      next(err);
    }
  },

  patchSubdomain: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const workspaceId = paramString(req.params.workspaceId);
      const websiteId = paramString(req.params.websiteId);
      const subdomain = req.body.subdomain as string;
      const data = await updateSubdomain(
        workspaceId,
        websiteId,
        subdomain,
        requestHost(req)
      );
      sendSuccess(res, "Subdomain updated", data);
    } catch (err) {
      next(err);
    }
  },
};

export const publicPublishingController = {
  getSite: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const subdomain = paramString(req.params.subdomain);
      const pageSlug =
        typeof req.query.pageSlug === "string"
          ? req.query.pageSlug
          : typeof req.query.slug === "string"
            ? req.query.slug
            : undefined;
      const data = await getPublicSiteBySubdomain(subdomain, pageSlug);
      sendSuccess(res, "Public site", data);
    } catch (err) {
      next(err);
    }
  },
};
