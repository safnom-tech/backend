import type { NextFunction, Request, Response } from "express";
import fs from "node:fs";
import { sendSuccess } from "../../utils/apiResponse.js";
import { AppError } from "../../middleware/error.middleware.js";
import * as mediaService from "./media.service.js";
import type { UploadedFileInput } from "./media.types.js";

function requireWorkspaceId(req: Request): string {
  const workspaceId = String(req.params.workspaceId ?? "");
  if (!workspaceId) {
    throw new AppError("Workspace not found", 404, "WORKSPACE_NOT_FOUND");
  }
  return workspaceId;
}

function fileFromRequest(req: Request): UploadedFileInput {
  const file = req.file;
  if (!file) {
    throw new AppError("File is required", 400, "INVALID_FILE");
  }
  return {
    buffer: file.buffer,
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

export const mediaController = {
  create: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const media = await mediaService.createMedia(
        workspaceId,
        fileFromRequest(req)
      );
      sendSuccess(res, "Media uploaded successfully", media, 201);
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
      const limit =
        typeof req.query.limit === "string"
          ? Number(req.query.limit)
          : undefined;
      const data = await mediaService.listMedia(
        workspaceId,
        Number.isFinite(limit) ? limit : 100
      );
      sendSuccess(res, "Media listed successfully", data);
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
      const mediaId = String(req.params.mediaId);
      const media = await mediaService.getMedia(workspaceId, mediaId);
      sendSuccess(res, "Media retrieved successfully", media);
    } catch (error) {
      next(error);
    }
  },

  content: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const mediaId = String(req.params.mediaId);
      const { absolutePath, mimeType } = await mediaService.getMediaContent(
        workspaceId,
        mediaId
      );
      res.type(mimeType);
      const stream = fs.createReadStream(absolutePath);
      stream.on("error", (err) => next(err));
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  publicContent: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mediaId = String(req.params.mediaId);
      const { absolutePath, mimeType } =
        await mediaService.getPublicMediaContent(mediaId);
      res.type(mimeType);
      res.setHeader("Cache-Control", "public, max-age=3600");
      const stream = fs.createReadStream(absolutePath);
      stream.on("error", (err) => next(err));
      stream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  replace: async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const workspaceId = requireWorkspaceId(req);
      const mediaId = String(req.params.mediaId);
      const media = await mediaService.replaceMedia(
        workspaceId,
        mediaId,
        fileFromRequest(req)
      );
      sendSuccess(res, "Media replaced successfully", media);
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
      const mediaId = String(req.params.mediaId);
      await mediaService.deleteMedia(workspaceId, mediaId);
      sendSuccess(res, "Media deleted successfully", { id: mediaId });
    } catch (error) {
      next(error);
    }
  },
};
